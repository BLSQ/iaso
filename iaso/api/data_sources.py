from rest_framework import viewsets
from rest_framework.response import Response
from iaso.models import DataSource

from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication


class DataSourceViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = []

    def list(self, request):
        sources = DataSource.objects.all()
        if not request.user.is_anonymous:
            profile = request.user.iaso_profile
            sources = sources.filter(projects__account=profile.account).distinct()
        return Response(
            {"sources": [source.as_dict() for source in sources.order_by("name")]}
        )
