"""
FHIR Location API for OrgUnits

This module provides a FHIR R4 compliant Location resource API
that maps Iaso OrgUnit objects to FHIR Location resources.

Reference: https://build.fhir.org/location.html
"""

import datetime
import logging

from django.http import Http404
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import NotFound
from rest_framework.response import Response

from iaso.models import OrgUnit

from .filters import FHIRLocationFilter
from .pagination import FHIRPaginator
from .permissions import FHIRLocationPermission
from .serializers import FHIRLocationSerializer


logger = logging.getLogger(__name__)


@extend_schema(tags=["FHIR"])
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
    pagination_class = FHIRPaginator

    def get_object(self):
        try:
            return super().get_object()
        except Http404:
            response = Response(
                {
                    "resourceType": "OperationOutcome",
                    "issue": [
                        {
                            "severity": "error",
                            "code": "not-found",
                            "details": {"text": f"Location with id '{self.kwargs.get('pk')}' not found"},
                        }
                    ],
                },
                status=status.HTTP_404_NOT_FOUND,
            )
            raise NotFound(detail=response.data)

    def get_queryset(self):
        return (
            OrgUnit.objects.filter_for_user(self.request.user)
            .select_related("org_unit_type", "parent", "version__data_source")
            .prefetch_related("groups")
        )

    @action(detail=True, methods=["get"])
    def children(self, request, pk=None):
        parent_org_unit = self.get_object()
        queryset = self.get_queryset().children(parent_org_unit)

        page = self.paginate_queryset(queryset)

        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.paginator.get_paginated_response(serializer.data, bundle_id=f"children-{pk}")

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def metadata(self, request):
        # GET /metadata is the FHIR-specified endpoint for capability statements (FHIR R4 spec §3.1.0.2)
        capability = {
            "resourceType": "CapabilityStatement",
            "status": "active",
            "date": datetime.datetime.today().strftime("%Y-%m-%d"),
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
                                    "definition": "https://openiaso.com/fhir/OperationDefinition/Location-children",
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
