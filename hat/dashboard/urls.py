from django.urls import path, re_path

from . import views


app_name = "dashboard"
urlpatterns = [
    path("home/", views.home_iaso, name="home_iaso"),
    re_path(r"^.*$", views.iaso, name="iaso"),
]
