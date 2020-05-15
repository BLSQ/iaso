from rest_framework import viewsets, permissions
from rest_framework.response import Response

from .common import HasPermission
from iaso.models import OrgUnitType


class OrgUnitTypeViewSet(viewsets.ViewSet):
    """ Org unit types API

    This API is restricted to authenticated users having at least one of the "menupermissions.iaso_forms",
    "menupermissions.iaso_org_units", or "menupermissions.iaso_links" permissions

    GET /api/orgunittypes/
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(
            [
                "menupermissions.iaso_forms",
                "menupermissions.iaso_org_units",
                "menupermissions.iaso_links",
            ]
        ),
    ]

    def list(self, request):
        queryset = OrgUnitType.objects.all()
        if not request.user.is_anonymous:
            profile = request.user.iaso_profile
            queryset = queryset.filter(projects__account=profile.account)
            default_app = None
        else:
            default_app = "org.bluesquarehub.iaso"

        app_id = request.GET.get("app_id", default_app)

        if app_id:
            queryset = queryset.filter(projects__app_id=app_id)
        queryset = queryset.order_by("depth").distinct().order_by("name")

        return Response(
            {"orgUnitTypes": [unit.as_dict(app_id=app_id) for unit in queryset]}
        )
