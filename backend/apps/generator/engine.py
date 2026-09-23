"""
SpringGenerator — Motor de generación de código Spring Boot en 5 capas.
Traduce el modelo conceptual del diagrama UML a código Java/Spring Boot empaquetado en .zip.
"""

import io
import os
import re
import zipfile
from pathlib import Path
from typing import Dict, Any, List
import jinja2

TEMPLATES_DIR = Path(__file__).resolve().parent / "templates"


def to_pascal_case(text: str) -> str:
    """Convierte texto a PascalCase válido para nombres de clases Java."""
    if not text:
        return "ClaseSinNombre"
    # Reemplazar caracteres no alfanuméricos
    cleaned = re.sub(r"[^a-zA-Z0-9_]", " ", str(text).strip())
    words = cleaned.split()
    if not words:
        return "ClaseGenerada"
    result = "".join(w[:1].upper() + w[1:] for w in words)
    # Si empieza con número, anteponer 'C'
    if result[0].isdigit():
        result = "C" + result
    return result


def to_camel_case(text: str) -> str:
    """Convierte texto a camelCase válido para nombres de atributos/métodos Java."""
    pascal = to_pascal_case(text)
    if not pascal:
        return "atributo"
    return pascal[:1].lower() + pascal[1:]


def to_snake_case(text: str) -> str:
    """Convierte texto a snake_case para nombres de tablas y columnas de base de datos."""
    s1 = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", text)
    s2 = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", s1)
    s3 = re.sub(r"[^a-zA-Z0-9_]", "_", s2)
    return re.sub(r"_+", "_", s3).strip("_").lower()


def to_plural_slug(text: str) -> str:
    """Genera la ruta plural para el endpoint REST (ej. Cliente -> clientes)."""
    snake = to_snake_case(text)
    if snake.endswith("s") or snake.endswith("x") or snake.endswith("z"):
        return snake + "es"
    return snake + "s"


def map_java_type(uml_type: str) -> str:
    """Mapea tipos UML a tipos de datos estándar de Java."""
    if not uml_type:
        return "String"
    t = uml_type.strip().lower()

    if t in ("string", "str", "texto", "varchar", "char", "text"):
        return "String"
    elif t in ("int", "integer", "entero"):
        return "Integer"
    elif t in ("long", "bigint"):
        return "Long"
    elif t in ("double", "float", "decimal", "real", "float8"):
        return "Double"
    elif t in ("boolean", "bool", "booleano"):
        return "Boolean"
    elif t in ("date", "fecha", "localdate"):
        return "LocalDate"
    elif t in ("datetime", "timestamp", "localdatetime", "fechahora"):
        return "LocalDateTime"
    elif t in ("bigdecimal", "dinero", "money", "precio"):
        return "BigDecimal"
    elif t in ("void", "vacio"):
        return "void"
    else:
        # Si es un nombre de clase existente en PascalCase, conservarlo
        return to_pascal_case(uml_type)


class SpringGenerator:
    """
    Parsea `datos_diagrama` y genera un proyecto Spring Boot empaquetado en .zip.
    """

    def __init__(self, datos_diagrama: Dict[str, Any], project_name: str,
                 group_id: str = "com.example", artifact_id: str = "backend"):
        self.raw_nodes = datos_diagrama.get("nodes", []) if datos_diagrama else []
        self.raw_edges = datos_diagrama.get("edges", []) if datos_diagrama else []
        self.project_name = project_name or "ProyectoUML"
        self.group_id = re.sub(r"[^a-z0-9_.]", "", group_id.lower().strip()) or "com.example"
        self.artifact_id = to_snake_case(artifact_id) or "backend"
        self.base_package = f"{self.group_id}.{self.artifact_id.replace('-', '_')}"
        self.database_name = f"{self.artifact_id}_db"

        # Inicializar Jinja2
        self.jinja_env = jinja2.Environment(
            loader=jinja2.FileSystemLoader(str(TEMPLATES_DIR)),
            autoescape=False,
            trim_blocks=True,
            lstrip_blocks=True,
        )

    def parse_model(self) -> List[Dict[str, Any]]:
        """
        Interpreta los nodos y aristas para construir la estructura de entidades.
        """
        entities_by_id = {}
        entities_by_name = {}

        # 1. Procesar clases (nodos)
        for node in self.raw_nodes:
            node_id = str(node.get("id"))
            data = node.get("data", {})
            raw_name = data.get("name") or f"Clase_{len(entities_by_id) + 1}"
            class_name = to_pascal_case(raw_name)

            # Evitar nombres duplicados
            base_name = class_name
            counter = 2
            while class_name in entities_by_name:
                class_name = f"{base_name}{counter}"
                counter += 1

            raw_attributes = data.get("attributes", [])
            attributes = []
            has_custom_id = False
            has_dates = False
            has_datetimes = False
            has_bigdecimals = False

            for attr in raw_attributes:
                attr_name_raw = attr.get("name") or "campo"
                attr_field = to_camel_case(attr_name_raw)
                attr_type_raw = attr.get("data_type") or "String"
                java_type = map_java_type(attr_type_raw)

                if java_type == "LocalDate":
                    has_dates = True
                elif java_type == "LocalDateTime":
                    has_datetimes = True
                elif java_type == "BigDecimal":
                    has_bigdecimals = True

                is_id = attr_field.lower() in ("id", "codigo", f"id{class_name.lower()}")
                if is_id:
                    # Marcar que el modelo define un ID pero NO incluirlo en los atributos:
                    # el template siempre genera un @Id Long id auto-incremental.
                    # Incluirlo aquí causaría un campo duplicado en la entidad generada.
                    has_custom_id = True
                    continue

                is_bool = java_type == "Boolean"
                getter_prefix = "is" if is_bool and not attr_field.startswith("is") else "get"
                capitalized_field = attr_field[:1].upper() + attr_field[1:]

                attributes.append({
                    "name": attr_name_raw,
                    "field_name": attr_field,
                    "java_type": java_type,
                    "column_name": to_snake_case(attr_field),
                    "getter_name": f"{getter_prefix}{capitalized_field}",
                    "setter_name": f"set{capitalized_field}",
                    "is_id": is_id,
                    "is_generated": is_id and java_type in ("Long", "Integer"),
                })

            entity = {
                "id": node_id,
                "name": class_name,
                "table_name": to_snake_case(class_name),
                "url_path": to_plural_slug(class_name),
                "attributes": attributes,
                "relationships": [],
                "parent_class": None,
                "is_parent_in_inheritance": False,
                "has_custom_id": has_custom_id,
                "has_dates": has_dates,
                "has_datetimes": has_datetimes,
                "has_bigdecimals": has_bigdecimals,
                "has_collections": False,
            }

            entities_by_id[node_id] = entity
            entities_by_name[class_name] = entity

        # 2. Procesar relaciones (aristas)
        for edge in self.raw_edges:
            source_id = str(edge.get("source"))
            target_id = str(edge.get("target"))

            if source_id not in entities_by_id or target_id not in entities_by_id:
                continue

            source_entity = entities_by_id[source_id]
            target_entity = entities_by_id[target_id]

            # Evitar autorrelaciones en herencia
            edge_data = edge.get("data", {})
            rel_type = (edge_data.get("relation_type") or "association").lower()
            src_mult = str(edge_data.get("sourceMultiplicity") or "").strip()
            tgt_mult = str(edge_data.get("targetMultiplicity") or "").strip()

            if rel_type == "inheritance":
                # En UML: flecha va del hijo (source) al padre (target)
                if source_entity != target_entity:
                    source_entity["parent_class"] = target_entity["name"]
                    target_entity["is_parent_in_inheritance"] = True

            elif rel_type in ("composition", "aggregation"):
                # Composición / Agregación:
                # El contenedor (source) tiene colección de items (target)
                target_class = target_entity["name"]
                field_name = to_camel_case(target_class) + "s"
                cap_field = field_name[:1].upper() + field_name[1:]
                mapped_by = to_camel_case(source_entity["name"])

                # En source: @OneToMany
                source_entity["relationships"].append({
                    "type": "OneToMany",
                    "target_class": target_class,
                    "field_name": field_name,
                    "mapped_by": mapped_by,
                    "is_collection": True,
                    "getter_name": f"get{cap_field}",
                    "setter_name": f"set{cap_field}",
                })
                source_entity["has_collections"] = True

                # En target: @ManyToOne
                tgt_field = mapped_by
                tgt_cap = tgt_field[:1].upper() + tgt_field[1:]
                target_entity["relationships"].append({
                    "type": "ManyToOne",
                    "target_class": source_entity["name"],
                    "field_name": tgt_field,
                    "join_column": f"{to_snake_case(source_entity['name'])}_id",
                    "fk_id_field": f"{tgt_field}Id",
                    "fk_label_field": f"{tgt_field}Nombre",
                    "fk_getter_name": f"get{tgt_cap}Id",
                    "fk_setter_name": f"set{tgt_cap}Id",
                    "is_collection": False,
                    "getter_name": f"get{tgt_cap}",
                    "setter_name": f"set{tgt_cap}",
                })

            else:
                # Asociación estándar
                # Analizar multiplicidades
                is_src_many = "*" in src_mult or "0..*" in src_mult or "1..*" in src_mult
                is_tgt_many = "*" in tgt_mult or "0..*" in tgt_mult or "1..*" in tgt_mult

                if is_src_many and is_tgt_many:
                    # ManyToMany
                    source_entity["relationships"].append({
                        "type": "ManyToMany",
                        "target_class": target_entity["name"],
                        "field_name": to_camel_case(target_entity["name"]) + "s",
                        "join_table": f"{source_entity['table_name']}_{target_entity['table_name']}",
                        "join_column": f"{source_entity['table_name']}_id",
                        "inverse_join_column": f"{target_entity['table_name']}_id",
                        "is_collection": True,
                        "getter_name": f"get{target_entity['name']}s",
                        "setter_name": f"set{target_entity['name']}s",
                    })
                    source_entity["has_collections"] = True
                elif is_tgt_many:
                    # OneToMany en source, ManyToOne en target
                    source_field = to_camel_case(target_entity["name"]) + "s"
                    cap_s = source_field[:1].upper() + source_field[1:]
                    source_entity["relationships"].append({
                        "type": "OneToMany",
                        "target_class": target_entity["name"],
                        "field_name": source_field,
                        "mapped_by": to_camel_case(source_entity["name"]),
                        "is_collection": True,
                        "getter_name": f"get{cap_s}",
                        "setter_name": f"set{cap_s}",
                    })
                    source_entity["has_collections"] = True

                    tgt_field = to_camel_case(source_entity["name"])
                    tgt_cap = tgt_field[:1].upper() + tgt_field[1:]
                    target_entity["relationships"].append({
                        "type": "ManyToOne",
                        "target_class": source_entity["name"],
                        "field_name": tgt_field,
                        "join_column": f"{to_snake_case(source_entity['name'])}_id",
                        "fk_id_field": f"{tgt_field}Id",
                        "fk_label_field": f"{tgt_field}Nombre",
                        "fk_getter_name": f"get{tgt_cap}Id",
                        "fk_setter_name": f"set{tgt_cap}Id",
                        "is_collection": False,
                        "getter_name": f"get{tgt_cap}",
                        "setter_name": f"set{tgt_cap}",
                    })
                else:
                    # ManyToOne (predeterminado para asociaciones simples)
                    field_name = to_camel_case(target_entity["name"])
                    cap_field = field_name[:1].upper() + field_name[1:]
                    source_entity["relationships"].append({
                        "type": "ManyToOne",
                        "target_class": target_entity["name"],
                        "field_name": field_name,
                        "join_column": f"{to_snake_case(target_entity['name'])}_id",
                        "fk_id_field": f"{field_name}Id",
                        "fk_label_field": f"{field_name}Nombre",
                        "fk_getter_name": f"get{cap_field}Id",
                        "fk_setter_name": f"set{cap_field}Id",
                        "is_collection": False,
                        "getter_name": f"get{cap_field}",
                        "setter_name": f"set{cap_field}",
                    })

        return list(entities_by_id.values())

    def generate_zip_bytes(self) -> bytes:
        """
        Ejecuta la generación de plantillas y retorna los bytes del archivo .zip.
        """
        entities = self.parse_model()

        # Si el modelo no tiene clases, crear una clase de ejemplo
        if not entities:
            entities = [{
                "id": "sample-1",
                "name": "Ejemplo",
                "table_name": "ejemplo",
                "url_path": "ejemplos",
                "attributes": [
                    {
                        "name": "nombre",
                        "field_name": "nombre",
                        "java_type": "String",
                        "column_name": "nombre",
                        "getter_name": "getNombre",
                        "setter_name": "setNombre",
                        "is_id": False,
                        "is_generated": False,
                    }
                ],
                "relationships": [],
                "parent_class": None,
                "is_parent_in_inheritance": False,
                "has_custom_id": False,
                "has_dates": False,
                "has_datetimes": False,
                "has_bigdecimals": False,
                "has_collections": False,
            }]

        package_path = self.base_package.replace(".", "/")
        root_dir = f"{self.artifact_id}"

        zip_buffer = io.BytesIO()

        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
            context_common = {
                "group_id": self.group_id,
                "artifact_id": self.artifact_id,
                "project_name": self.project_name,
                "base_package": self.base_package,
                "database_name": self.database_name,
                "entities": entities,
            }

            # 1. pom.xml
            pom_content = self.jinja_env.get_template("pom.xml.j2").render(context_common)
            zf.writestr(f"{root_dir}/pom.xml", pom_content)

            # 2. application.properties
            app_props = self.jinja_env.get_template("application.properties.j2").render(context_common)
            zf.writestr(f"{root_dir}/src/main/resources/application.properties", app_props)

            # 3. Application.java
            main_app = self.jinja_env.get_template("Application.java.j2").render(context_common)
            zf.writestr(f"{root_dir}/src/main/java/{package_path}/Application.java", main_app)

            # 4. README.md
            readme = self.jinja_env.get_template("README.md.j2").render(context_common)
            zf.writestr(f"{root_dir}/README.md", readme)

            # 5. Capas para cada entidad
            for entity in entities:
                ctx_entity = {**context_common, "entity": entity}

                # Capa 1: Entity
                entity_src = self.jinja_env.get_template("entity.java.j2").render(ctx_entity)
                zf.writestr(f"{root_dir}/src/main/java/{package_path}/entity/{entity['name']}.java", entity_src)

                # Capa 2: DTOs (Request y Response)
                dto_req = self.jinja_env.get_template("dto_request.java.j2").render(ctx_entity)
                zf.writestr(f"{root_dir}/src/main/java/{package_path}/dto/{entity['name']}RequestDTO.java", dto_req)

                dto_res = self.jinja_env.get_template("dto_response.java.j2").render(ctx_entity)
                zf.writestr(f"{root_dir}/src/main/java/{package_path}/dto/{entity['name']}ResponseDTO.java", dto_res)

                # Capa 3: Mapper
                mapper_src = self.jinja_env.get_template("mapper.java.j2").render(ctx_entity)
                zf.writestr(f"{root_dir}/src/main/java/{package_path}/mapper/{entity['name']}Mapper.java", mapper_src)

                # Capa 4: Repository
                repo_src = self.jinja_env.get_template("repository.java.j2").render(ctx_entity)
                zf.writestr(f"{root_dir}/src/main/java/{package_path}/repository/{entity['name']}Repository.java", repo_src)

                # Capa 5: Service e Implementación
                service_src = self.jinja_env.get_template("service.java.j2").render(ctx_entity)
                zf.writestr(f"{root_dir}/src/main/java/{package_path}/service/{entity['name']}Service.java", service_src)

                impl_src = self.jinja_env.get_template("service_impl.java.j2").render(ctx_entity)
                zf.writestr(f"{root_dir}/src/main/java/{package_path}/service/impl/{entity['name']}ServiceImpl.java", impl_src)

                # Capa 6: Controller
                ctrl_src = self.jinja_env.get_template("controller.java.j2").render(ctx_entity)
                zf.writestr(f"{root_dir}/src/main/java/{package_path}/controller/{entity['name']}Controller.java", ctrl_src)

        return zip_buffer.getvalue()
