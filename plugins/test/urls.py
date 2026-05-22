from django.urls import path
from django.views.generic import TemplateView


app_name = "test"

urlpatterns = [
    path("homepage/", TemplateView.as_view(template_name="plugins/test/homepage.html"), name="homepage"),
]
