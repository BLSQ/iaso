from django.urls import path, re_path

from . import views


app_name = "dashboard"
urlpatterns = [
    re_path(r"^polio/embeddedCalendar/.*$", views.embeddable_iaso, name="embedded_calendar"),
    re_path(r"^polio/embeddedVaccineRepository/.*$", views.embeddable_iaso, name="embedded_vaccine_repository"),
    re_path(r"^polio/embeddedVaccineStock/.*$", views.embeddable_iaso, name="embedded_vaccine_stock"),
    re_path(r"^polio/embeddedLqasCountry/.*$", views.embeddable_iaso, name="embedded_lqas_country"),
    re_path(r"^polio/embeddedLqasMap/.*$", views.embeddable_iaso, name="embedded_lqas_map"),
    path("home/", views.home_iaso, name="home_iaso"),
    re_path(r"^.*$", views.iaso, name="iaso"),
]
