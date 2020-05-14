from django.core.exceptions import PermissionDenied

from rest_framework import viewsets
from rest_framework.response import Response

from iaso.models import Instance


class PeriodsViewSet(viewsets.ViewSet):
    """
    API to list periods for a specific form
    Examples:


    GET /api/periods/

    """

    permission_classes = []

    def list(self, request):

        if request.user.is_anonymous:
            raise PermissionDenied("Please log in")

        form_id = request.GET.get("form_id", None)
        if not form_id:
            return Response({"res": "Problem: please provide a form id"})
        queryset = Instance.objects.filter(form__id=form_id)
        queryset = queryset.filter(period__isnull=False).order_by("period")
        res = queryset.values_list("period", flat=True).distinct()

        return Response({"periods": res})
