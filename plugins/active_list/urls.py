from django.urls import path, re_path

from . import views


urlpatterns = [
    path("homepage/", views.homepage, name="homepage"),
    path("patient_list/", views.patient_list, name="patient_list"),
    path("patient_list_api/<int:org_unit_id>/<str:month>/", views.patient_list_api, name="patient_list_api"),
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
]
