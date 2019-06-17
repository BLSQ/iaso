from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import OrgUnit


class OrgUnitViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = []
    permission_classes = []

    def list(self, request):

        queryset = OrgUnit.objects.order_by("id")
        print(queryset.count())

        return Response({"orgUnits": [unit.as_dict() for unit in queryset]})
