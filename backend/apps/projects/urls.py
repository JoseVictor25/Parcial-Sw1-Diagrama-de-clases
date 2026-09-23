from django.urls import path
from .views import (
    ProjectListCreateView,
    ProjectDetailView,
    add_collaborator,
    remove_collaborator,
    project_diagram,
    project_snapshots,
    restore_snapshot,
    generate_spring_boot,
    export_xmi,
    import_xmi,
)

urlpatterns = [
    path("projects/", ProjectListCreateView.as_view(), name="project-list-create"),
    path("projects/<int:pk>/", ProjectDetailView.as_view(), name="project-detail"),
    path("projects/<int:pk>/diagram/", project_diagram, name="project-diagram"),
    path("projects/<int:pk>/collaborators/", add_collaborator, name="project-add-collaborator"),
    path("projects/<int:pk>/collaborators/<int:user_id>/", remove_collaborator, name="project-remove-collaborator"),
    path("projects/<int:pk>/snapshots/", project_snapshots, name="project-snapshots"),
    path("projects/<int:pk>/snapshots/<int:snap_id>/restore/", restore_snapshot, name="project-restore-snapshot"),
    path("projects/<int:pk>/generate/spring-boot/", generate_spring_boot, name="project-generate-spring-boot"),
    path("projects/<int:pk>/export-xmi/", export_xmi, name="project-export-xmi"),
    path("projects/<int:pk>/import-xmi/", import_xmi, name="project-import-xmi"),
]
