from django.urls import path

from .views import PipelineDetailView, PipelineListView


app_name = "openhexa"

urlpatterns = [
    path("pipelines/", PipelineListView.as_view(), name="pipeline-list"),
    path("pipelines/<str:pipeline_id>/", PipelineDetailView.as_view(), name="pipeline-detail"),
]
