from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import DataSource, SourceVersion

from .authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class SourceVersionViewSet(viewsets.ViewSet):
    """
    list:
    """

    # Check with Mobile application if not broken
    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        versions = SourceVersion.objects.all()
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
