from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import OrgUnitType, Project
from rest_framework.authentication import BasicAuthentication
from .auth.authentication import CsrfExemptSessionAuthentication


class OrgUnitTypeViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        app_id = request.GET.get("app_id", "org.bluesquarehub.iaso")
        queryset = OrgUnitType.objects.all()
        if not request.user.is_anonymous:
            profile = request.user.iaso_profile
            queryset = queryset.filter(projects__account=profile.account)

        queryset = queryset.filter(projects__app_id=app_id).order_by("depth")

        return Response(
            {"orgUnitTypes": [unit.as_dict(app_id=app_id) for unit in queryset]}
        )
