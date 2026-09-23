from rest_framework import serializers
from .models import DiagramClass, ClassAttribute, ClassMethod, ClassRelation


class ClassAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassAttribute
        fields = ["id", "name", "data_type", "visibility", "default_value", "order"]


class ClassMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClassMethod
        fields = ["id", "name", "return_type", "visibility", "parameters", "order"]


class DiagramClassSerializer(serializers.ModelSerializer):
    attributes = ClassAttributeSerializer(many=True, read_only=True)
    methods = ClassMethodSerializer(many=True, read_only=True)

    class Meta:
        model = DiagramClass
        fields = ["id", "name", "pos_x", "pos_y", "width", "is_abstract", "attributes", "methods", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class ClassRelationSerializer(serializers.ModelSerializer):
    source_name = serializers.CharField(source="source.name", read_only=True)
    target_name = serializers.CharField(source="target.name", read_only=True)

    class Meta:
        model = ClassRelation
        fields = [
            "id", "source", "source_name", "target", "target_name",
            "relation_type", "multiplicity_source", "multiplicity_target", "label", "created_at",
        ]
        read_only_fields = ["id", "created_at", "source_name", "target_name"]


class DiagramSerializer(serializers.Serializer):
    """Serializer para el estado completo del diagrama (clases + relaciones)."""
    classes = DiagramClassSerializer(many=True)
    relations = ClassRelationSerializer(many=True)
