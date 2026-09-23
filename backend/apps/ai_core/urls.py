from django.urls import path
from .views import ai_suggest, ai_vision, ai_diagnose, ai_help_chat

urlpatterns = [
    path("ai/suggest/", ai_suggest, name="ai-suggest"),
    path("ai/vision/", ai_vision, name="ai-vision"),
    path("ai/diagnose/", ai_diagnose, name="ai-diagnose"),
    path("ai/help/", ai_help_chat, name="ai-help-chat"),
]
