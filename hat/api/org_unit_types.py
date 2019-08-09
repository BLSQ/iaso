from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import OrgUnitType, Project


class OrgUnitTypeViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = []
    permission_classes = []

    def list(self, request):
        app_id = request.GET.get("app_id", "com.bluesquarehub.iaso")
        queryset = OrgUnitType.objects.filter(projects__app_id=app_id).order_by("id")

        return Response({"orgUnitTypes": [unit.as_dict() for unit in queryset]})
