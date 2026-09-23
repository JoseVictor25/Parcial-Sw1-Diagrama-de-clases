from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from apps.projects.models import Project, ProjectCollaborator
from .models import DiagramClass, ClassAttribute, ClassMethod, ClassRelation
from .serializers import (
    DiagramClassSerializer, ClassAttributeSerializer,
    ClassMethodSerializer, ClassRelationSerializer,
)


def get_project_or_403(pk, user):
    """Verifica que el usuario tenga acceso al proyecto."""
    project = get_object_or_404(Project, pk=pk)
    is_owner = project.owner == user
    is_collab = ProjectCollaborator.objects.filter(project=project, user=user).exists()
    if not (is_owner or is_collab):
        return None, Response({"detail": "No tienes acceso a este proyecto."}, status=status.HTTP_403_FORBIDDEN)
    return project, None


# ─── Diagrama completo ─────────────────────────────────────────────────────────

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def get_diagram(request, pk):
    """GET /api/projects/{id}/diagram/ — Estado completo del diagrama."""
    project, error = get_project_or_403(pk, request.user)
    if error:
        return error

    classes = DiagramClass.objects.filter(project=project).prefetch_related("attributes", "methods")
    relations = ClassRelation.objects.filter(project=project)

    return Response({
        "classes": DiagramClassSerializer(classes, many=True).data,
        "relations": ClassRelationSerializer(relations, many=True).data,
    })


# ─── Clases ────────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_class(request, pk):
    """POST /api/projects/{id}/classes/ — Crear clase."""
    project, error = get_project_or_403(pk, request.user)
    if error:
        return error

    serializer = DiagramClassSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(project=project)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["GET", "PATCH", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def class_detail(request, pk, class_id):
    """GET|PATCH|DELETE /api/projects/{id}/classes/{class_id}/"""
    project, error = get_project_or_403(pk, request.user)
    if error:
        return error

    diagram_class = get_object_or_404(DiagramClass, pk=class_id, project=project)

    if request.method == "GET":
        return Response(DiagramClassSerializer(diagram_class).data)
    elif request.method == "PATCH":
        serializer = DiagramClassSerializer(diagram_class, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    elif request.method == "DELETE":
        diagram_class.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Atributos ─────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_attribute(request, pk, class_id):
    """POST /api/projects/{id}/classes/{class_id}/attributes/"""
    project, error = get_project_or_403(pk, request.user)
    if error:
        return error

    diagram_class = get_object_or_404(DiagramClass, pk=class_id, project=project)
    serializer = ClassAttributeSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(diagram_class=diagram_class)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def attribute_detail(request, pk, class_id, attr_id):
    """PATCH|DELETE /api/projects/{id}/classes/{class_id}/attributes/{attr_id}/"""
    project, error = get_project_or_403(pk, request.user)
    if error:
        return error

    diagram_class = get_object_or_404(DiagramClass, pk=class_id, project=project)
    attribute = get_object_or_404(ClassAttribute, pk=attr_id, diagram_class=diagram_class)

    if request.method == "PATCH":
        serializer = ClassAttributeSerializer(attribute, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    elif request.method == "DELETE":
        attribute.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Métodos ───────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_method(request, pk, class_id):
    """POST /api/projects/{id}/classes/{class_id}/methods/"""
    project, error = get_project_or_403(pk, request.user)
    if error:
        return error

    diagram_class = get_object_or_404(DiagramClass, pk=class_id, project=project)
    serializer = ClassMethodSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save(diagram_class=diagram_class)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def method_detail(request, pk, class_id, method_id):
    """PATCH|DELETE /api/projects/{id}/classes/{class_id}/methods/{method_id}/"""
    project, error = get_project_or_403(pk, request.user)
    if error:
        return error

    diagram_class = get_object_or_404(DiagramClass, pk=class_id, project=project)
    method = get_object_or_404(ClassMethod, pk=method_id, diagram_class=diagram_class)

    if request.method == "PATCH":
        serializer = ClassMethodSerializer(method, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    elif request.method == "DELETE":
        method.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── Relaciones ────────────────────────────────────────────────────────────────

@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_relation(request, pk):
    """POST /api/projects/{id}/relations/"""
    project, error = get_project_or_403(pk, request.user)
    if error:
        return error

    serializer = ClassRelationSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    # Verificar que source y target pertenecen al mismo proyecto
    source = get_object_or_404(DiagramClass, pk=serializer.validated_data["source"].id, project=project)
    target = get_object_or_404(DiagramClass, pk=serializer.validated_data["target"].id, project=project)

    serializer.save(project=project)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["PATCH", "DELETE"])
@permission_classes([permissions.IsAuthenticated])
def relation_detail(request, pk, relation_id):
    """PATCH|DELETE /api/projects/{id}/relations/{relation_id}/"""
    project, error = get_project_or_403(pk, request.user)
    if error:
        return error

    relation = get_object_or_404(ClassRelation, pk=relation_id, project=project)

    if request.method == "PATCH":
        serializer = ClassRelationSerializer(relation, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    elif request.method == "DELETE":
        relation.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
