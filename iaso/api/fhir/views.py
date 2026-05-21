"""
FHIR Location API for OrgUnits

This module provides a FHIR R4 compliant Location resource API
that maps Iaso OrgUnit objects to FHIR Location resources.

Reference: https://build.fhir.org/location.html
"""

import logging

from django.http import Http404
from django.urls import reverse
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.models import OrgUnit

from .filters import FHIRLocationFilter
from .pagination import FHIRPaginator
from .permissions import FHIRLocationPermission
from .serializers import FHIRLocationSerializer


logger = logging.getLogger(__name__)


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

    def get_queryset(self):
        return (
            OrgUnit.objects.filter_for_user(self.request.user)
            .select_related("org_unit_type", "parent", "version__data_source")
            .prefetch_related("groups")
        )

    def retrieve(self, request, *args, **kwargs):
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
        try:
            parent_org_unit = self.get_object()
            children_queryset = self.get_queryset().children(parent_org_unit)

            page = self.paginate_queryset(children_queryset)
            serializer = self.get_serializer(page, many=True)

            # Use the Location list URL as the base for child resource URLs
            location_base_url = request.build_absolute_uri(reverse("fhir-location-list")).rstrip("/")
            bundle = self.paginator.get_fhir_bundle(
                serializer.data, bundle_id=f"children-{pk}", base_url=location_base_url
            )
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
        # GET /metadata is the FHIR-specified endpoint for capability statements (FHIR R4 spec §3.1.0.2)
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
