# -*- coding: utf-8 -*-
from django.urls import path
from .views import debug, delete_beneficiaries_analytics


urlpatterns = [
    path("debug/<int:id>/", debug, name="wfp_debug"),
    path("delete_beneficiaries_analytics/", delete_beneficiaries_analytics, name="delete_beneficiaries_analytics"),
]
