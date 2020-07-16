from django.conf.urls import url
from . import views

app_name = "dashboard"

urlpatterns = [
    url(r"^$", views.iaso, name="iaso"),
    url(r"^forms.*$", views.iaso, name="iaso_forms"),
    url(r"^instances.*$", views.iaso, name="iaso_instances"),
    url(r"^instance.*$", views.iaso, name="iaso_instance_detail"),
    url(r"^orgunits.*$", views.iaso, name="iaso_orgunits"),
    url(r"^orgunits/detail.*$", views.iaso, name="iaso_orgunits_details"),
    url(r"^orgunits/groups.*$", views.iaso, name="iaso_orgunits_groups"),
    url(r"^orgunits/types.*$", views.iaso, name="iaso_orgunits_types"),
    url(r"^completeness.*$", views.iaso, name="iaso_completeness"),
    url(r"^settings.*$", views.iaso, name="iaso_settings"),
    url(r"^401.*$", views.iaso, name="iaso_401"),
    url(r"^404.*$", views.iaso, name="iaso_404"),
    url(r"^500.*$", views.iaso, name="iaso_500"),
]
