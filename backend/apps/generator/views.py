from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from apps.projects.models import Project, ProjectCollaborator
from .engine import SpringGenerator, to_snake_case


@api_view(["GET", "POST"])
@permission_classes([permissions.IsAuthenticated])
def generate_spring_boot(request, pk):
    """
    GET / POST /api/projects/{id}/generate/spring-boot/
    Genera y descarga el backend Spring Boot estructurado en 5 capas como archivo .zip.
    """
    project = get_object_or_404(Project, pk=pk)

    # Verificar acceso (dueño o colaborador)
    is_owner = project.owner_id == request.user.id
    is_collab = ProjectCollaborator.objects.filter(project=project, user_id=request.user.id).exists()
    if not (is_owner or is_collab):
        return Response(
            {"detail": "No tienes permiso para generar código de este proyecto."},
            status=status.HTTP_403_FORBIDDEN
        )

    # Obtener parámetros opcionales
    data = request.data if request.method == "POST" else request.query_params
    group_id = data.get("group_id", "com.example")
    artifact_id = data.get("artifact_id", to_snake_case(project.name) or "backend")

    datos_diagrama = project.datos_diagrama or {"nodes": [], "edges": []}

    try:
        generator = SpringGenerator(
            datos_diagrama=datos_diagrama,
            project_name=project.name,
            group_id=group_id,
            artifact_id=artifact_id,
        )
        zip_bytes = generator.generate_zip_bytes()
    except Exception as e:
        return Response(
            {"detail": f"Error al generar código: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

    filename = f"{to_snake_case(project.name) or 'proyecto'}-backend.zip"
    response = HttpResponse(zip_bytes, content_type="application/zip")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    response["Content-Length"] = len(zip_bytes)
    # Exponer encabezado Content-Disposition para clientes axios/fetch
    response["Access-Control-Expose-Headers"] = "Content-Disposition"
    return response
