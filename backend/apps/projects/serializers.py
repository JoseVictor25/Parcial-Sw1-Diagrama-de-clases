from rest_framework import serializers
from apps.accounts.serializers import UserSerializer
from .models import Project, ProjectCollaborator, DiagramSnapshot


class ProjectCollaboratorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = ProjectCollaborator
        fields = ["id", "user", "role", "joined_at"]
        read_only_fields = ["id", "joined_at"]


class ProjectSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    collaborators = ProjectCollaboratorSerializer(many=True, read_only=True)
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = ["id", "name", "description", "owner", "collaborators", "is_owner", "datos_diagrama", "created_at", "updated_at"]
        read_only_fields = ["id", "owner", "created_at", "updated_at"]

    def get_is_owner(self, obj):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            return obj.owner == request.user
        return False


class AddCollaboratorSerializer(serializers.Serializer):
    """Serializer para agregar un colaborador por email o username."""
    identifier = serializers.CharField(help_text="Email o username del usuario a invitar")
    role = serializers.ChoiceField(
        choices=ProjectCollaborator.Role.choices,
        default=ProjectCollaborator.Role.EDITOR,
    )


class DiagramSnapshotSerializer(serializers.ModelSerializer):
    """Serializer para snapshots de historial de versiones del diagrama."""
    saved_by = UserSerializer(read_only=True)

    class Meta:
        model = DiagramSnapshot
        fields = ["id", "saved_by", "diagram_data", "label", "created_at"]
        read_only_fields = ["id", "saved_by", "created_at"]
