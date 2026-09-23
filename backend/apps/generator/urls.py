from django.urls import path
from .views import generate_spring_boot

urlpatterns = [
    path("projects/<int:pk>/generate/spring-boot/", generate_spring_boot, name="generate-spring-boot"),
]
