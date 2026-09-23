from django.db import models
from apps.projects.models import Project


class DiagramClass(models.Model):
    """Clase en el diagrama UML."""
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="classes")
    name = models.CharField(max_length=200)
    pos_x = models.FloatField(default=100.0)
    pos_y = models.FloatField(default=100.0)
    width = models.FloatField(default=200.0)
    is_abstract = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Clase"
        verbose_name_plural = "Clases"
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} (proyecto: {self.project.name})"


class ClassAttribute(models.Model):
    """Atributo de una clase UML."""

    class Visibility(models.TextChoices):
        PUBLIC = "+", "Public"
        PRIVATE = "-", "Private"
        PROTECTED = "#", "Protected"
        PACKAGE = "~", "Package"

    diagram_class = models.ForeignKey(DiagramClass, on_delete=models.CASCADE, related_name="attributes")
    name = models.CharField(max_length=200)
    data_type = models.CharField(max_length=100, default="String")
    visibility = models.CharField(max_length=1, choices=Visibility.choices, default=Visibility.PRIVATE)
    default_value = models.CharField(max_length=200, blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "Atributo"
        verbose_name_plural = "Atributos"

    def __str__(self):
        return f"{self.visibility}{self.name}: {self.data_type}"


class ClassMethod(models.Model):
    """Método de una clase UML."""

    class Visibility(models.TextChoices):
        PUBLIC = "+", "Public"
        PRIVATE = "-", "Private"
        PROTECTED = "#", "Protected"
        PACKAGE = "~", "Package"

    diagram_class = models.ForeignKey(DiagramClass, on_delete=models.CASCADE, related_name="methods")
    name = models.CharField(max_length=200)
    return_type = models.CharField(max_length=100, default="void")
    visibility = models.CharField(max_length=1, choices=Visibility.choices, default=Visibility.PUBLIC)
    parameters = models.JSONField(default=list, blank=True)  # [{"name": "x", "type": "int"}]
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["order", "name"]
        verbose_name = "Método"
        verbose_name_plural = "Métodos"

    def __str__(self):
        return f"{self.visibility}{self.name}(): {self.return_type}"


class ClassRelation(models.Model):
    """Relación entre dos clases del diagrama."""

    class RelationType(models.TextChoices):
        ASSOCIATION = "association", "Asociación"
        INHERITANCE = "inheritance", "Herencia"
        COMPOSITION = "composition", "Composición"
        AGGREGATION = "aggregation", "Agregación"
        DEPENDENCY = "dependency", "Dependencia"
        REALIZATION = "realization", "Realización"

    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="relations")
    source = models.ForeignKey(DiagramClass, on_delete=models.CASCADE, related_name="outgoing_relations")
    target = models.ForeignKey(DiagramClass, on_delete=models.CASCADE, related_name="incoming_relations")
    relation_type = models.CharField(max_length=20, choices=RelationType.choices, default=RelationType.ASSOCIATION)
    multiplicity_source = models.CharField(max_length=10, blank=True, default="")  # ej: "1", "0..*"
    multiplicity_target = models.CharField(max_length=10, blank=True, default="")
    label = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Relación"
        verbose_name_plural = "Relaciones"

    def __str__(self):
        return f"{self.source.name} --{self.relation_type}--> {self.target.name}"
