from django.urls import path
from .views import (
    get_diagram, create_class, class_detail,
    create_attribute, attribute_detail,
    create_method, method_detail,
    create_relation, relation_detail,
)

urlpatterns = [
    # Diagrama completo
    path("projects/<int:pk>/diagram/", get_diagram, name="diagram-full"),

    # Clases
    path("projects/<int:pk>/classes/", create_class, name="class-create"),
    path("projects/<int:pk>/classes/<int:class_id>/", class_detail, name="class-detail"),

    # Atributos
    path("projects/<int:pk>/classes/<int:class_id>/attributes/", create_attribute, name="attribute-create"),
    path("projects/<int:pk>/classes/<int:class_id>/attributes/<int:attr_id>/", attribute_detail, name="attribute-detail"),

    # Métodos
    path("projects/<int:pk>/classes/<int:class_id>/methods/", create_method, name="method-create"),
    path("projects/<int:pk>/classes/<int:class_id>/methods/<int:method_id>/", method_detail, name="method-detail"),

    # Relaciones
    path("projects/<int:pk>/relations/", create_relation, name="relation-create"),
    path("projects/<int:pk>/relations/<int:relation_id>/", relation_detail, name="relation-detail"),
]
