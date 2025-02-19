from django.urls import path, re_path

from . import views


app_name = "dashboard"
urlpatterns = [
    re_path(r"^polio/embeddedCalendar/.*$", views.embeddable_iaso, name="embedded_calendar"),
    re_path(r"^polio/embeddedVaccineRepository/.*$", views.embeddable_iaso, name="embedded_vaccine_repository"),
    path("home/", views.home_iaso, name="home_iaso"),
    re_path(r"^.*$", views.iaso, name="iaso"),
]
