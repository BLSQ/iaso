from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import DataSource, SourceVersion

from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class SourceVersionViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        versions = SourceVersion.objects.all()
        if not request.user.is_anonymous:
            profile = request.user.iaso_profile
            versions = versions.filter(data_source__account=profile.account)

        source_id = request.GET.get("source", None)
        if source_id:
            versions = versions.filter(data_source_id=source_id)

        return Response(
            {
                "versions": [
                    version.as_dict()
                    for version in versions.order_by("data_source_id", "number")
                ]
            }
        )
