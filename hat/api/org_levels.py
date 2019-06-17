from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import OrgLevel


class OrgLevelViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = []
    permission_classes = []

    def list(self, request):
        queryset = OrgLevel.objects.all()
        return Response({"orgLevels": [level.as_dict() for level in queryset]})
