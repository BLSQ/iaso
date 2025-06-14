"""
FHIR Location API for OrgUnits

This module provides a FHIR R4 compliant Location resource API
that maps Iaso OrgUnit objects to FHIR Location resources.

Reference: https://build.fhir.org/location.html
"""

import logging

from typing import Any, Dict, List

from django.db import models
from django.http import Http404
from django_filters import rest_framework as django_filters
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.models import OrgUnit

from .serializers import (
    FHIRLocationSerializer,
)


logger = logging.getLogger(__name__)


class FHIRLocationFilter(django_filters.FilterSet):
    """
    Filter set for FHIR Location resources
    """

    # FHIR search parameters
    name = django_filters.CharFilter(field_name="name", lookup_expr="icontains")
    status = django_filters.CharFilter(method="filter_status")
    identifier = django_filters.CharFilter(method="filter_identifier")
    type = django_filters.CharFilter(field_name="org_unit_type__short_name")

    class Meta:
        model = OrgUnit
        fields = ["name", "status", "identifier", "type"]

    def filter_identifier(self, queryset, name, value):
        """Filter by any identifier (source_ref, uuid, or alias)"""
        return queryset.filter(models.Q(source_ref=value) | models.Q(uuid=value) | models.Q(aliases__contains=[value]))

    def filter_status(self, queryset, name, value):
        """Filter by FHIR status mapped to validation_status"""
        status_mapping = {
            "active": OrgUnit.VALIDATION_VALID,
            "inactive": OrgUnit.VALIDATION_NEW,
            "suspended": OrgUnit.VALIDATION_REJECTED,
        }

        if value in status_mapping:
            return queryset.filter(validation_status=status_mapping[value])
        return queryset


class FHIRLocationPermission(permissions.BasePermission):
    """
    Custom permission class for FHIR Location API
    """

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.has_perm(permission.ORG_UNITS)


class FHIRLocationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    FHIR Location API ViewSet for OrgUnits

    Provides FHIR R4 compliant Location resource endpoints that map
    Iaso OrgUnit objects to FHIR Location resources.

    Supported operations:
    - GET /fhir/Location - List locations (Bundle)
    - GET /fhir/Location/{id} - Read single location
    - GET /fhir/Location/{id}/children - Get child locations
    - GET /fhir/Location/metadata - Get capability statement
    """

    serializer_class = FHIRLocationSerializer
    permission_classes = [FHIRLocationPermission]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_class = FHIRLocationFilter
    search_fields = ["name"]

    def get_queryset(self):
        """
        Get OrgUnit queryset filtered for the current user
        """
        return (
            OrgUnit.objects.filter_for_user(self.request.user)
            .select_related("org_unit_type", "parent", "version__data_source")
            .prefetch_related("groups")
        )

    def create_fhir_bundle(self, locations_data: List[Dict], total_count: int, request) -> Dict[str, Any]:
        """
        Create a FHIR Bundle response containing Location resources
        """
        entries = []
        for location_data in locations_data:
            entries.append(
                {
                    "resource": location_data,
                    "fullUrl": f"{request.build_absolute_uri().split('?')[0]}/{location_data['id']}",
                }
            )

        bundle = {
            "resourceType": "Bundle",
            "id": "search-results",
            "meta": {"lastUpdated": "2024-01-01T00:00:00Z"},
            "type": "searchset",
            "total": total_count,
            "entry": entries,
        }

        # Add pagination links
        links = self._build_pagination_links(request, total_count)
        if links:
            bundle["link"] = links

        return bundle

    def _get_pagination_params(self, request):
        """Get pagination parameters from request"""
        try:
            page_size = int(request.query_params.get("_count", 20))
            page_size = min(page_size, 100)  # Max 100
        except (TypeError, ValueError):
            page_size = 20

        try:
            offset = int(request.query_params.get("_skip", 0))
        except (TypeError, ValueError):
            offset = 0

        return page_size, offset

    def _build_pagination_links(self, request, total_count: int) -> List[Dict[str, str]]:
        """Build FHIR pagination links"""
        links = []

        # Get pagination parameters
        page_size, offset = self._get_pagination_params(request)

        # Self link
        self_url = request.build_absolute_uri().split("?")[0]
        if request.query_params:
            self_url += f"?{request.query_params.urlencode()}"
        links.append({"relation": "self", "url": self_url})

        # Next link
        if offset + page_size < total_count:
            next_params = request.query_params.copy()
            next_params["_skip"] = offset + page_size
            next_url = f"{request.build_absolute_uri().split('?')[0]}?{next_params.urlencode()}"
            links.append({"relation": "next", "url": next_url})

        # Previous link
        if offset > 0:
            prev_params = request.query_params.copy()
            prev_params["_skip"] = max(0, offset - page_size)
            prev_url = f"{request.build_absolute_uri().split('?')[0]}?{prev_params.urlencode()}"
            links.append({"relation": "previous", "url": prev_url})

        return links

    def list(self, request, *args, **kwargs):
        """
        List all Location resources as FHIR Bundle
        """
        queryset = self.filter_queryset(self.get_queryset())

        # Apply pagination manually to get total count
        total_count = queryset.count()
        page_size, offset = self._get_pagination_params(request)

        paginated_queryset = queryset[offset : offset + page_size]

        # Serialize locations
        serializer = self.get_serializer(paginated_queryset, many=True)

        # Create FHIR Bundle
        bundle = self.create_fhir_bundle(serializer.data, total_count, request)

        return Response(bundle)

    def retrieve(self, request, *args, **kwargs):
        """
        Retrieve a single Location resource by ID
        """
        try:
            instance = self.get_object()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Http404:
            error_response = {
                "resourceType": "OperationOutcome",
                "issue": [
                    {
                        "severity": "error",
                        "code": "not-found",
                        "details": {"text": f"Location with id '{kwargs.get('pk')}' not found"},
                    }
                ],
            }
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=["get"])
    def children(self, request, pk=None):
        """
        Get child locations (sub org units) of a specific location
        """
        try:
            parent_org_unit = self.get_object()
            children_queryset = self.get_queryset().children(parent_org_unit)

            # Serialize child locations
            serializer = self.get_serializer(children_queryset, many=True)

            # Create FHIR Bundle for children
            bundle = self.create_fhir_bundle(serializer.data, children_queryset.count(), request)
            bundle["id"] = f"children-{pk}"

            return Response(bundle)

        except Http404:
            error_response = {
                "resourceType": "OperationOutcome",
                "issue": [
                    {
                        "severity": "error",
                        "code": "not-found",
                        "details": {"text": f"Location with id '{pk}' not found"},
                    }
                ],
            }
            return Response(error_response, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=["get"])
    def metadata(self, request):
        """
        Return FHIR CapabilityStatement for Location resource
        """
        capability = {
            "resourceType": "CapabilityStatement",
            "status": "active",
            "date": "2024-01-01",
            "publisher": "Iaso",
            "kind": "instance",
            "software": {"name": "Iaso FHIR Location API", "version": "1.0.0"},
            "fhirVersion": "4.0.1",
            "format": ["json"],
            "rest": [
                {
                    "mode": "server",
                    "resource": [
                        {
                            "type": "Location",
                            "interaction": [{"code": "read"}, {"code": "search-type"}],
                            "operation": [
                                {
                                    "name": "children",
                                    "definition": "http://openiaso.com/fhir/OperationDefinition/Location-children",
                                }
                            ],
                            "searchParam": [
                                {"name": "name", "type": "string", "documentation": "Search by location name"},
                                {
                                    "name": "status",
                                    "type": "token",
                                    "documentation": "Search by location status (active|suspended|inactive)",
                                },
                                {
                                    "name": "identifier",
                                    "type": "token",
                                    "documentation": "Search by any identifier (source_ref, uuid, alias)",
                                },
                                {"name": "type", "type": "token", "documentation": "Search by org unit type"},
                                {
                                    "name": "_count",
                                    "type": "number",
                                    "documentation": "Number of results per page (max 100)",
                                },
                                {"name": "_skip", "type": "number", "documentation": "Number of results to skip"},
                            ],
                        }
                    ],
                }
            ],
        }

        return Response(capability)
