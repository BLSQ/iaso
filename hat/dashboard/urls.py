from django.urls import path
from django.urls import re_path

from . import views

app_name = "dashboard"
urlpatterns = [
    re_path(r"^polio/embeddedCalendar/.*$", views.embeddable_iaso, name="embedded"),
    path("home/", views.home_iaso, name="home_iaso"),
    re_path(r"^.*$", views.iaso, name="iaso"),
]
