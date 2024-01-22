# -*- coding: utf-8 -*-
from django.urls import path
from .views.views import debug


urlpatterns = [
    path("debug/<int:id>/", debug, name="wfp_debug"),
]

