from django.core.exceptions import PermissionDenied
from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import SourceVersion


class SourceVersionViewSet(viewsets.ViewSet):
    """
    list:
    """

    permission_classes = []

    def list(self, request):
        versions = SourceVersion.objects.all()
        if request.user.is_anonymous:
            raise PermissionDenied("Please log in")

        profile = request.user.iaso_profile
        versions = versions.filter(data_source__projects__account=profile.account)

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
