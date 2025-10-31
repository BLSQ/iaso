"""
URL configuration for FHIR API endpoints
"""

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .location import FHIRLocationViewSet


# Create router for FHIR endpoints
router = DefaultRouter()
router.register(r"Location", FHIRLocationViewSet, basename="fhir-location")

urlpatterns = [
    path("", include(router.urls)),
]
