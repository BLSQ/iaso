from django.db.models import Prefetch
from django.utils.translation import gettext_lazy as _
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import permissions
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.filters import OrderingFilter
from rest_framework.response import Response

from dynamic_fields.filter_backends import DynamicFieldsFilterBackendBackwardCompatible
from iaso.api.common import ModelViewSet, ReadOnlyOrHasPermission
from iaso.api.permission_checks import (
    AuthenticationEnforcedPermission,
)
from iaso.models import Form, OrgUnitType, Project
from iaso.permissions.core_permissions import CORE_ORG_UNITS_TYPES_PERMISSION

from ..filters import OrgUnitTypeDropdownFilter, OrgUnitTypeFilter
from ..pagination import OrgUnitTypePagination
from ..serializers import (
    OrgUnitTypeCreateSerializer,
    OrgUnitTypeHierarchySerializer,
    OrgUnitTypeListSerializer,
    OrgUnitTypeRetrieveSerializer,
    OrgUnitTypesDropdownSerializer,
    OrgUnitTypeUpdateSerializer,
)


@extend_schema(tags=["Org unit types v2", "v2"])
class OrgUnitTypeViewSetV2(ModelViewSet):
    """Org unit types API

    Read: any authenticated user. Write: CORE_ORG_UNITS_TYPES_PERMISSION (staff/superuser bypass).

    GET /api/v2/orgunittypes/
    """

    permission_classes = [
        AuthenticationEnforcedPermission,
        permissions.IsAuthenticated,
        ReadOnlyOrHasPermission(CORE_ORG_UNITS_TYPES_PERMISSION),
    ]

    http_method_names = ["get", "post", "patch", "put", "delete", "head", "options", "trace"]
    filter_backends = [DjangoFilterBackend, DynamicFieldsFilterBackendBackwardCompatible, OrderingFilter]
    ordering = ["name"]
    pagination_class = OrgUnitTypePagination

    @property
    def filterset_class(self):
        if self.action == "dropdown":
            return OrgUnitTypeDropdownFilter

        return OrgUnitTypeFilter

    def perform_destroy(self, instance):
        if instance.org_units.count():
            raise ValidationError(_("You can't delete a type that still has org units"))

        super().perform_destroy(instance)

    def get_serializer_class(self):
        if self.action == "dropdown":
            return OrgUnitTypesDropdownSerializer
        if self.action == "hierarchy":
            return OrgUnitTypeHierarchySerializer
        if self.action == "list":
            return OrgUnitTypeListSerializer
        if self.action == "retrieve":
            return OrgUnitTypeRetrieveSerializer
        if self.action == "create":
            return OrgUnitTypeCreateSerializer
        if self.action in ["update", "partial_update"]:
            return OrgUnitTypeUpdateSerializer
        raise NotImplementedError()

    def get_queryset(self):
        queryset = OrgUnitType.objects.filter_for_user(self.request.user)

        if self.action == "destroy":
            queryset = queryset.prefetch_related("org_units")

        if self.action == "dropdown":
            queryset = queryset.only("id", "name", "depth", "sub_unit_types").prefetch_related("sub_unit_types")

        if self.action in ["list", "retrieve"]:
            prefetch_projects = Prefetch(
                "projects",
                queryset=Project.objects.select_related("account")
                .prefetch_related("projectfeatureflags_set", "projectfeatureflags_set__featureflag")
                .all(),
            )
            queryset = queryset.prefetch_related(
                Prefetch("reference_forms", queryset=Form.objects.prefetch_related(prefetch_projects)),
                prefetch_projects,
                "sub_unit_types",
                "allow_creating_sub_unit_types",
            )

        return queryset.distinct()

    @extend_schema(responses=OrgUnitTypesDropdownSerializer(many=True))
    @action(detail=False, methods=["GET"], pagination_class=None)
    def dropdown(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(
        detail=True,
        methods=["GET"],
        url_path="hierarchy",
    )
    def hierarchy(self, request, pk=None, *args, **kwargs):
        """
        Get the complete hierarchy of a specific org unit type.

        This endpoint returns the org unit type with all its sub_unit_types
        recursively, building the complete hierarchy tree.

        GET /api/v2/orgunittypes/{id}/hierarchy/
        """
        return super().retrieve(request, *args, **kwargs)
