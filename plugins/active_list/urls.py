from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter

from . import views
from .tasks.api.launch_export_entities_to_records import ExportEntitiesToRecordsViewSet
from .tasks.api.launch_export_records_to_entities import ExportRecordsToEntitiesViewSet


# Create router for API endpoints
router = DefaultRouter()
router.register(
    r"tasks/export_records_to_entities", ExportRecordsToEntitiesViewSet, basename="export_records_to_entities"
)
router.register(
    r"tasks/export_entities_to_records", ExportEntitiesToRecordsViewSet, basename="export_entities_to_records"
)


urlpatterns = [
    # Include API endpoints from router
    path("api/", include(router.urls)),
    # Existing views
    path("homepage/", views.homepage, name="homepage"),
    path("patient_list/", views.patient_list, name="patient_list"),
    path("patient_list_api/<int:org_unit_id>/<str:month>/", views.patient_list_api, name="patient_list_api"),
    path(
        "patient_list_upload_format/<int:org_unit_id>/<str:month>/",
        views.patient_list_upload_format_api,
        name="patient_list_upload_format_api",
    ),
    path("upload/", views.upload, name="upload"),
    path("download/", views.download, name="download"),
    path("validation_api/<int:org_unit_id>/<str:month>/", views.validation_api, name="validation_api"),
    path("patient/", views.patient_form, name="patient_form_create"),  # creating a new patient
    path("patient/<int:patient_id>/", views.patient_form, name="patient_form_update"),  # updating an existing patient.
    path("import/<int:import_id>/", views.import_detail_view, name="import_detail"),
    path("search/", views.patient_search, name="patient_search"),
    path("search_api/", views.patient_search_api, name="patient_search_api"),
    path("patient_history/", views.patient_history, name="patient_history"),
    re_path(
        r"^validation/$",
        views.validation,
        name="validation",
    ),
    path("validation_region/", views.validation_region, name="validation_region"),
    path(
        "validation_region_api/<int:org_unit_id>/<str:month>/",
        views.validation_region_api,
        name="validation_region_api",
    ),
    path("imports_list/", views.imports_list, name="imports_list"),
    path("imports_list_api/", views.imports_list_api, name="imports_list_api"),
]
