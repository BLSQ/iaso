from django.conf.urls import url, include
from . import views
from django.urls import path

urlpatterns = [
    url(r"^$", views.index, name="polio"),
    path("/lqas/<str:slug>/", views.lqas),
]
