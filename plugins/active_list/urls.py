from django.urls import path, re_path
from . import views

urlpatterns = [
    path("upload/", views.upload, name="upload"),
    path("validation_api/<int:org_unit_id>/<str:period>/", views.validation_api, name="validation_api"),
    re_path(
        r"^validation/$",
        views.validation,
        name="validation_with_params",
    ),
]
