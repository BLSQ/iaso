from django.urls import re_path

from . import views

app_name = "dashboard"
urlpatterns = [
    re_path(r"^polio/embeddedCalendar/.*$", views.embeddable_iaso, name="embedded"),
    re_path(r"^home/$", views.home_iaso, name="home_iaso"),
    re_path(r"^.*$", views.iaso, name="iaso"),
]
