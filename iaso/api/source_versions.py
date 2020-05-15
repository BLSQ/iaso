from rest_framework import viewsets, permissions
from rest_framework.response import Response
from iaso.models import SourceVersion


class SourceVersionViewSet(viewsets.ViewSet):
    """Source versions API

    This API is restricted to authenticated users (no specific permission check)

    GET /api/sourceversions/
    """

    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        versions = SourceVersion.objects.all()
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
