from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import OrgUnitType


class OrgUnitTypeViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = []
    permission_classes = []

    def list(self, request):

        queryset = OrgUnitType.objects.order_by("id")
        print(queryset.count())

        return Response({"orgUnitTypes": [unit.as_dict() for unit in queryset]})
