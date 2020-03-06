from rest_framework import viewsets
from rest_framework.response import Response

from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated

from iaso.dhis2 import status_queries
from iaso.models import Instance


def to_completeness(count):
    return {
        "period": count["period"],
        "form": {
            "id": count["form_id"],
            "name": count["form__name"],
            "period_type": "MONTH",
        },
        "counts": {
            "total": count["total_count"],
            "error": count["duplicated_count"],
            "exported": count["exported_count"],
            "ready": count["ready_count"],
        },
    }


class CompletenessViewSet(viewsets.ViewSet):
    """
    list:
    """

    authentication_classes = (CsrfExemptSessionAuthentication, BasicAuthentication)
    permission_classes = [IsAuthenticated]

    def list(self, request):

        queryset = Instance.objects
        profile = request.user.iaso_profile
        queryset = queryset.filter(project__account=profile.account)

        counts = [
            to_completeness(count)
            for count in status_queries.counts_by_status(queryset)
        ]
        return Response({"completeness": counts})
