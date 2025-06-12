from rest_framework import filters, viewsets

from iaso.api.org_unit_shapes.pagination import OrgUnitShapePagination
from iaso.api.org_unit_shapes.permissions import HasOrgUnitsShapePermission
from iaso.api.org_unit_shapes.serializers import OrgUnitShapeSerializer
from iaso.models import OrgUnit


class OrgUnitShapeViewSet(viewsets.ModelViewSet):
    """
    This endpoint is used to work with the geometric shape of an org unit.
    """

    filter_backends = [filters.OrderingFilter]
    http_method_names = ["get", "options", "head", "trace", "patch"]
    ordering_fields = ["id", "name"]
    pagination_class = OrgUnitShapePagination
    permission_classes = [HasOrgUnitsShapePermission]
    serializer_class = OrgUnitShapeSerializer

    def get_queryset(self):
        return OrgUnit.objects.filter_for_user(self.request.user)
