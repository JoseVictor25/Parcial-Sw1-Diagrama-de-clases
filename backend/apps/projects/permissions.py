from rest_framework.permissions import BasePermission
from .models import ProjectCollaborator


class IsProjectOwner(BasePermission):
    """Permite acceso solo al dueño del proyecto o administradores."""
    message = "Solo el dueño del proyecto puede realizar esta acción."

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or request.user.is_staff:
            return True
        return obj.owner == request.user


class IsProjectMember(BasePermission):
    """Permite acceso al owner, administradores y a los colaboradores del proyecto."""
    message = "No tienes acceso a este proyecto."

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or request.user.is_staff or obj.owner == request.user:
            return True
        return ProjectCollaborator.objects.filter(project=obj, user=request.user).exists()
