from rest_framework import viewsets
from rest_framework.response import Response

from .auth.authentication import CsrfExemptSessionAuthentication
from rest_framework.authentication import BasicAuthentication
from rest_framework.permissions import IsAuthenticated

from iaso.models import Instance


def to_completeness(count):
    return {
        "period": count["period"],
        "form": {
            "id": count["form_id"],
            "name": count["form__name"],
            "period_type": "QUARTER" if "Q" in count["period"] else "MONTH",
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
        profile = request.user.iaso_profile
        queryset = Instance.objects.filter(
            project__account=profile.account
        ).with_status()
        counts = [to_completeness(count) for count in queryset.counts_by_status()]

        return Response({"completeness": counts})
