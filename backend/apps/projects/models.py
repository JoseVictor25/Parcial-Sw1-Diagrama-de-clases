from django.db import models
from apps.accounts.models import User


class Project(models.Model):
    """Proyecto de modelado UML."""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="owned_projects")
    datos_diagrama = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "proyecto"
        ordering = ["-updated_at"]
        verbose_name = "Proyecto"
        verbose_name_plural = "Proyectos"

    def __str__(self):
        return f"{self.name} (owner: {self.owner.email})"


class ProjectCollaborator(models.Model):
    """Relación entre un proyecto y sus colaboradores."""

    class Role(models.TextChoices):
        EDITOR = "editor", "Editor"
        VIEWER = "viewer", "Visualizador"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="collaborators")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="collaborations")
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.EDITOR)
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "detalle_proyecto"
        unique_together = ("project", "user")
        verbose_name = "Detalle de Proyecto"
        verbose_name_plural = "Detalles de Proyecto"

    def __str__(self):
        return f"{self.user.email} → {self.project.name} ({self.role})"


class DiagramSnapshot(models.Model):
    """Snapshot (versión guardada) del diagrama de un proyecto."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="snapshots")
    saved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="snapshots")
    diagram_data = models.JSONField(default=dict)
    label = models.CharField(max_length=200, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "diagrama_snapshot"
        ordering = ["-created_at"]
        verbose_name = "Snapshot de Diagrama"
        verbose_name_plural = "Snapshots de Diagrama"

    def __str__(self):
        return f"Snapshot #{self.pk} — {self.project.name} ({self.created_at:%Y-%m-%d %H:%M})"
