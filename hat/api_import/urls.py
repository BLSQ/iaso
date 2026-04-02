from django.urls import path

from .views import APIImportViewSet


urlpatterns = [path("list/", APIImportViewSet.as_view({"get": "list"}), name="apiimport")]
