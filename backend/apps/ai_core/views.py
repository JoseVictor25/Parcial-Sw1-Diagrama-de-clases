import os
import base64
import json
import re
import requests as req
from rest_framework.decorators import api_view, permission_classes
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings


# â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _reload_env():
    from dotenv import load_dotenv
    from pathlib import Path
    load_dotenv(Path(settings.BASE_DIR) / ".env", override=True)


def _get_gemini_key():
    _reload_env()
    key = getattr(settings, "GEMINI_API_KEY", "") or os.getenv("GEMINI_API_KEY", "")
    return key.strip() if key else ""


def _gemini_post(model: str, payload: dict, key: str, timeout: int = 15):
    """Llama a la API de Gemini y devuelve el objeto Response."""
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    return req.post(url, json=payload, timeout=timeout)


def _parse_json_safe(text: str):
    """Extrae el primer objeto JSON vÃ¡lido de un texto."""
    try:
        return json.loads(text.strip())
    except Exception:
        pass
    match = re.search(r'\{[\s\S]*\}', text)
    if match:
        try:
            return json.loads(match.group())
        except Exception:
            pass
    return None


# Modelos de Gemini disponibles (en orden de preferencia para visión)
GEMINI_MODELS = [
    "gemini-3-flash-preview",
    "gemini-flash-latest",
    "gemini-flash-lite-latest",
    "gemini-3.1-flash-lite",
]


# â”€â”€â”€ CU-09: Chat con IA (Asistente del diagrama) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

def _build_chat_prompt(diagram_data: dict, user_message: str) -> str:
    classes = []
    nodes = diagram_data.get("nodes", [])
    edges = diagram_data.get("edges", [])

    for node in nodes:
        d = node.get("data", {})
        name = d.get("name", "?")
        attrs = [
            f"  {a.get('visibility','')}{a.get('name','')}: {a.get('data_type','')}"
            for a in d.get("attributes", [])
        ]
        methods = [
            f"  {m.get('visibility','')}{m.get('name','')}: {m.get('return_type','')}"
            for m in d.get("methods", [])
        ]
        classes.append(f"Clase: {name}\n" + "\n".join(attrs + methods))

    relations = []
    for edge in edges:
        d = edge.get("data", {})
        rel_type = d.get("relation_type", "association")
        src = edge.get("source", "?")
        tgt = edge.get("target", "?")
        relations.append(f"  {src} --[{rel_type}]--> {tgt}")

    diagram_text = "\n\n".join(classes) if classes else "(Diagrama vacÃ­o)"
    relations_text = "\n".join(relations) if relations else "  (sin relaciones)"

    return f"""Eres un experto en diseÃ±o orientado a objetos y UML 2.5.
El usuario tiene este diagrama de clases UML actual:

=== CLASES ===
{diagram_text}

=== RELACIONES ===
{relations_text}

=== COMANDO / PREGUNTA DEL USUARIO ===
{user_message}

Debes responder ÃšNICAMENTE con un objeto JSON vÃ¡lido con la siguiente estructura:
{{
  "message": "Respuesta en texto para el usuario, confirmando lo que hiciste o aconsejando.",
  "updates": [
    {{ "action": "add_class", "name": "NombreClase" }},
    {{ "action": "add_attribute", "class_name": "NombreClase", "attr_name": "nombre", "data_type": "String", "visibility": "-" }},
    {{ "action": "add_relation", "source_class": "ClaseA", "target_class": "ClaseB", "relation_type": "association" }},
    {{ "action": "delete_class", "name": "NombreClase" }},
    {{ "action": "delete_attribute", "class_name": "NombreClase", "attr_name": "nombre" }},
    {{ "action": "delete_relation", "source_class": "ClaseA", "target_class": "ClaseB" }}
  ]
}}
- Si el usuario te pide agregar o eliminar una clase, atributo o relaciÃ³n, incluye la acciÃ³n en 'updates'.
- Tipos de relaciÃ³n soportados: 'association', 'dependency', 'inheritance', 'aggregation', 'composition'.
- Si el usuario solo hace una pregunta, 'updates' debe ser una lista vacÃ­a [].
"""


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def ai_suggest(request):
    """POST /api/ai/suggest/ â€” Chat con IA sobre el diagrama (solo Gemini)."""
    message = request.data.get("message", "").strip()
    diagram_data = request.data.get("diagram_data", {})

    if not message:
        return Response(
            {"detail": "El mensaje no puede estar vacÃ­o."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    gemini_key = _get_gemini_key()
    if not gemini_key:
        return Response(
            {"detail": "GEMINI_API_KEY no configurada. AgrÃ©gala al archivo .env del backend."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    prompt = _build_chat_prompt(diagram_data, message)
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"response_mime_type": "application/json"},
    }
    errors = []

    for model in GEMINI_MODELS:
        try:
            resp = _gemini_post(model, payload, gemini_key, timeout=15)
            if resp.status_code == 200:
                _rdata = resp.json()
                _parts = _rdata.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                raw = _parts[0].get("text", "") if _parts else ""
                parsed = _parse_json_safe(raw)
                if parsed:
                    return Response({
                        "reply": parsed.get("message", "Hecho."),
                        "updates": parsed.get("updates", []),
                        "model": f"Gemini ({model})",
                    })
                return Response({
                    "reply": "Se ejecutÃ³ el comando pero no se pudo leer la respuesta.",
                    "updates": [],
                    "model": f"Gemini ({model})",
                })
            elif resp.status_code == 503:
                errors.append(f"{model}: sobrecargado (503)")
                continue
            elif resp.status_code in (400, 403):
                errors.append(f"{model}: clave invÃ¡lida (HTTP {resp.status_code})")
                break
            else:
                errors.append(f"{model}: HTTP {resp.status_code} â€” {resp.text[:120]}")
        except Exception as e:
            errors.append(f"{model}: {str(e)}")

    error_detail = "\n".join(f"â€¢ {e}" for e in errors)
    return Response(
        {"detail": f"Error al conectar con Gemini.\n\n{error_detail}"},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


# â”€â”€â”€ CU-10: Imagen â†’ Diagrama UML (solo Gemini Vision) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€



# --- Chatbot Guia de Usuario (UMLCraft Help Assistant) ---

HELP_SYSTEM_PROMPT = (
    "Eres el Asistente Oficial de UMLCraft. Tu mision es ayudar a los usuarios a usar la plataforma.\n\n"
    "=== GUIA DE USO ===\n\n"
    "1. LIENZO: Doble clic agrega una clase. Arrastra nodos para moverlos.\n"
    "2. TOOLBOX: Boton Clase agrega nodo. Relaciones: Asociacion, Herencia, Composicion, Agregacion, Dependencia.\n"
    "3. EDITAR CLASES: Clic en nodo abre propiedades. Tipos: String, Integer, Double, Boolean, LocalDate, LocalDateTime, BigDecimal. El campo id NO se agrega manualmente.\n"
    "4. GUARDAR: Boton Guardar o Ctrl+S.\n"
    "5. DESHACER/REHACER: Ctrl+Z / Ctrl+Y.\n"
    "6. HISTORIAL: Ver y restaurar versiones anteriores del diagrama.\n"
    "7. EXPORTAR PNG: Descarga imagen del diagrama.\n"
    "8. COLABORADORES: Invitar usuarios a editar en tiempo real.\n"
    "9. IMPORTAR IMAGEN: Sube foto de boceto UML y la IA lo convierte en clases.\n"
    "10. XMI: Exportar/Importar compatible con Enterprise Architect.\n"
    "11. ASISTENTE UML IA: Chat para sugerir mejoras o agregar/eliminar elementos.\n"
    "12. GENERAR BACKEND: Boton azul genera .zip Spring Boot en 5 capas (Entity, DTO, Repository, Service, Controller).\n\n"
    "PASOS PARA EJECUTAR EL BACKEND:\n"
    "1. Descomprimir el .zip\n"
    "2. Abrir carpeta en VSCode o IntelliJ\n"
    "3. Editar application.properties con datos PostgreSQL:\n"
    "   spring.datasource.url=jdbc:postgresql://localhost:5432/NOMBRE_BD\n"
    "   spring.datasource.username=tu_usuario\n"
    "   spring.datasource.password=tu_contrasena\n"
    "4. Crear BD: CREATE DATABASE NOMBRE_BD;\n"
    "5. Ejecutar: mvn spring-boot:run\n"
    "6. API en http://localhost:8080 | Swagger: http://localhost:8080/swagger-ui.html\n\n"
    "Responde siempre en espanol, de forma clara y didactica. Solo sobre UMLCraft y Spring Boot."
)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def ai_help_chat(request):
    """POST /api/ai/help/ -- Chatbot guia de usuario para aprender a usar UMLCraft."""
    message = request.data.get("message", "").strip()
    if not message:
        return Response(
            {"detail": "El mensaje no puede estar vacio."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    gemini_key = _get_gemini_key()
    if not gemini_key:
        return Response(
            {"detail": "GEMINI_API_KEY no configurada."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    full_prompt = HELP_SYSTEM_PROMPT + "\n\n=== PREGUNTA DEL USUARIO ===\n" + message
    payload = {
        "contents": [{"parts": [{"text": full_prompt}]}],
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 1024},
    }
    errors = []
    for model in GEMINI_MODELS:
        try:
            resp = _gemini_post(model, payload, gemini_key, timeout=15)
            if resp.status_code == 200:
                _rdata = resp.json()
                _parts = _rdata.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                raw = _parts[0].get("text", "") if _parts else ""
                return Response({"reply": raw.strip(), "model": "Gemini (" + model + ")" })
            elif resp.status_code == 503:
                errors.append(model + ": sobrecargado")
                continue
            elif resp.status_code in (400, 403):
                errors.append(model + ": clave invalida")
                break
            else:
                errors.append(model + ": HTTP " + str(resp.status_code))
        except Exception as e:
            errors.append(model + ": " + str(e))

    return Response(
        {"detail": "Error Gemini: " + " | ".join(errors)},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


VISION_PROMPT = """Analiza esta imagen y extrae TODAS las clases UML que puedas ver, junto con sus relaciones, multiplicidades y etiquetas.

Responde ÃšNICAMENTE con un JSON vÃ¡lido con esta estructura exacta (sin markdown, sin texto extra):
{
  "classes": [
    {
      "name": "NombreClase",
      "is_abstract": false,
      "attributes": [
        {"name": "nombreAtributo", "data_type": "String", "visibility": "-"}
      ],
      "methods": [
        {"name": "nombreMetodo", "return_type": "void", "visibility": "+"}
      ]
    }
  ],
  "relations": [
    {
      "source": "ClaseOrigen",
      "target": "ClaseDestino",
      "relation_type": "association",
      "source_multiplicity": "1",
      "target_multiplicity": "*",
      "label": "nombre de la relacion si aparece"
    }
  ],
  "description": "Breve descripcion de lo que se encontro en la imagen"
}

Reglas IMPORTANTES:
- visibility: "+" para public, "-" para private, "#" para protected
- relation_type: "association", "inheritance", "composition", "aggregation", "dependency"
  * Herencia/Generalizacion (flecha triangular hueca) -> "inheritance"
  * Composicion (rombo relleno) -> "composition"
  * Agregacion (rombo hueco) -> "aggregation"
  * Dependencia (linea punteada) -> "dependency"
  * Asociacion simple (linea solida) -> "association"
- source_multiplicity y target_multiplicity: extrae los valores EXACTOS que aparecen en la imagen,
  por ejemplo "1", "0..1", "1..*", "*", "0..*", "1..1". Si no hay multiplicidad visible, usa "".
- label: etiqueta de la relacion si aparece (ej: "tiene", "realiza", "pertenece"). Si no hay, usa "".
- Si no hay clases detectables, retorna {"classes": [], "relations": [], "description": "No se encontraron clases UML"}
- Los nombres de clases deben estar en PascalCase sin espacios
- Responde en espaÃ±ol en el campo description
- Es FUNDAMENTAL que detectes TODAS las relaciones entre clases del diagrama"""


def _build_reactflow_data(parsed: dict):
    """Convierte la respuesta de Gemini a formato React Flow (nodes + edges)."""
    import time
    nodes = []
    edges = []
    class_id_map = {}

    for i, cls in enumerate(parsed.get("classes", [])):
        node_id = f"class-vision-{i}-{int(time.time() * 1000) + i}"
        class_name = cls.get("name", f"Clase{i + 1}")
        class_id_map[class_name] = node_id

        col = i % 4
        row = i // 4

        nodes.append({
            "id": node_id,
            "type": "classNode",
            "position": {"x": 80 + col * 300, "y": 80 + row * 260},
            "data": {
                "id": node_id,
                "name": class_name,
                "is_abstract": cls.get("is_abstract", False),
                "attributes": [
                    {
                        "id": f"attr-{node_id}-{j}",
                        "name": a.get("name", "attr"),
                        "data_type": a.get("data_type", "String"),
                        "visibility": a.get("visibility", "-"),
                    }
                    for j, a in enumerate(cls.get("attributes", []))
                ],
                "methods": [
                    {
                        "id": f"method-{node_id}-{j}",
                        "name": m.get("name", "metodo"),
                        "return_type": m.get("return_type", "void"),
                        "visibility": m.get("visibility", "+"),
                        "parameters": [],
                    }
                    for j, m in enumerate(cls.get("methods", []))
                ],
            },
        })

    for k, rel in enumerate(parsed.get("relations", [])):
        src_name = rel.get("source", "")
        tgt_name = rel.get("target", "")
        src_id = class_id_map.get(src_name)
        tgt_id = class_id_map.get(tgt_name)
        if src_id and tgt_id:
            edges.append({
                "id": f"edge-vision-{k}",
                "type": "umlEdge",
                "reconnectable": True,
                "source": src_id,
                "target": tgt_id,
                "sourceHandle": "bottom-source",
                "targetHandle": "top-target",
                "data": {
                    "relation_type": rel.get("relation_type", "association"),
                    "sourceMultiplicity": rel.get("source_multiplicity", ""),
                    "targetMultiplicity": rel.get("target_multiplicity", ""),
                    "label": rel.get("label", ""),
                    "bendX": 0,
                    "bendY": 0,
                },
            })

    return nodes, edges


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def ai_vision(request):
    """
    POST /api/ai/vision/
    Analiza una imagen con Gemini Vision y genera un diagrama de clases UML.
    Body (multipart/form-data): { image: File }
    Respuesta: { nodes, edges, description, model }
    """
    image_file = request.FILES.get("image")
    if not image_file:
        return Response(
            {"detail": "Se requiere una imagen."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    gemini_key = _get_gemini_key()
    if not gemini_key:
        return Response(
            {
                "nodes": [], "edges": [], "description": "", "model": "none",
                "error": (
                    "GEMINI_API_KEY no configurada.\n\n"
                    "1. Ve a https://aistudio.google.com -> Get API Key\n"
                    "2. Agrega GEMINI_API_KEY=tu_clave al archivo .env del backend\n"
                    "3. Reinicia el servidor Django"
                ),
            },
            status=status.HTTP_200_OK,
        )

    image_data = image_file.read()
    image_b64 = base64.b64encode(image_data).decode("utf-8")
    mime_type = image_file.content_type or "image/jpeg"

    payload = {
        "contents": [{
            "parts": [
                {"text": VISION_PROMPT},
                {"inline_data": {"mime_type": mime_type, "data": image_b64}},
            ]
        }]
    }

    errors = []

    for model in GEMINI_MODELS:
        try:
            resp = _gemini_post(model, payload, gemini_key, timeout=60)
            if resp.status_code == 200:
                data = resp.json()
                candidates = data.get("candidates", [])
                if candidates:
                    raw = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    parsed = _parse_json_safe(raw)
                    if parsed and "classes" in parsed and len(parsed.get("classes", [])) > 0:
                        nodes, edges = _build_reactflow_data(parsed)
                        return Response({
                            "nodes": nodes,
                            "edges": edges,
                            "description": parsed.get("description", f"Clases extraÃ­das con {model}"),
                            "model": f"Gemini Vision ({model})",
                            "classes_found": len(nodes),
                            "relations_found": len(edges),
                        })
                    elif parsed and "classes" in parsed:
                        errors.append(f"{model}: no se detectaron clases ({parsed.get('description', '')})")
                    else:
                        errors.append(f"{model}: respuesta no parseable -> {raw[:150]}")
            elif resp.status_code == 503:
                errors.append(f"{model}: sobrecargado (503), probando siguiente...")
                continue
            elif resp.status_code in (400, 403):
                errors.append(f"{model}: clave invÃ¡lida o sin permisos (HTTP {resp.status_code}) â€” {resp.text[:150]}")
                break  # No tiene sentido probar mÃ¡s modelos con la misma clave invÃ¡lida
            else:
                errors.append(f"{model}: HTTP {resp.status_code} â€” {resp.text[:120]}")
        except Exception as e:
            errors.append(f"{model}: {str(e)}")

    error_detail = "\n".join(f"â€¢ {e}" for e in errors)
    return Response(
        {
            "nodes": [], "edges": [], "description": "", "model": "none",
            "errors": errors,
            "error": (
                f"No se pudieron extraer clases de la imagen.\n\n"
                f"Detalles:\n{error_detail}\n\n"
                f"Sugerencias:\n"
                f"1. Verifica que la GEMINI_API_KEY en el .env sea vÃ¡lida.\n"
                f"2. ObtÃ©n una clave gratis en https://aistudio.google.com\n"
                f"3. Usa una imagen nÃ­tida con texto legible."
            ),
        },
        status=status.HTTP_200_OK,
    )


# â”€â”€â”€ DiagnÃ³stico de Gemini â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def ai_diagnose(request):
    """GET /api/ai/diagnose/ â€” Verifica el estado de Gemini."""
    results = {}

    gemini_key = _get_gemini_key()
    if not gemini_key:
        results["gemini"] = {
            "status": "error",
            "detail": "GEMINI_API_KEY no configurada en .env",
        }
    else:
        try:
            payload = {"contents": [{"parts": [{"text": "Responde solo: OK"}]}]}
            resp = _gemini_post("gemini-3.5-flash", payload, gemini_key, timeout=15)
            if resp.status_code == 200:
                results["gemini"] = {
                    "status": "ok",
                    "model": "gemini-3.5-flash",
                    "detail": "Gemini disponible y funcionando correctamente",
                }
            elif resp.status_code == 400:
                results["gemini"] = {
                    "status": "error",
                    "detail": f"Clave invÃ¡lida o mal formateada: {resp.text[:200]}",
                }
            elif resp.status_code == 403:
                results["gemini"] = {
                    "status": "error",
                    "detail": "Clave sin permisos o invÃ¡lida (403). Genera una nueva en aistudio.google.com",
                }
            else:
                results["gemini"] = {
                    "status": "error",
                    "detail": f"HTTP {resp.status_code}: {resp.text[:200]}",
                }
        except Exception as e:
            results["gemini"] = {"status": "error", "detail": str(e)}

    return Response(results)

