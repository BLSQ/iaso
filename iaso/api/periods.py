from rest_framework import permissions, viewsets
from rest_framework.response import Response

from iaso.models import Instance
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_SUBMISSIONS_PERMISSION

from .common import HasPermission


class PeriodsViewSet(viewsets.ViewSet):
    f"""Periods API

    Note: only used to list periods for a specific form (the form_id query param is mandatory).

    This API is restricted to authenticated users having the "{CORE_FORMS_PERMISSION}" or "{CORE_SUBMISSIONS_PERMISSION}" permissions.

    GET /api/periods/?form_id=id
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(CORE_FORMS_PERMISSION, CORE_SUBMISSIONS_PERMISSION),  # type: ignore
    ]

    def list(self, request):
        form_id = request.GET.get("form_id", None)
        if not form_id:  # TODO: 400 Bad Request
            return Response({"res": "Problem: please provide a form id"})
        queryset = Instance.objects.filter(form__id=form_id)
        queryset = queryset.filter(period__isnull=False).order_by("period")
        res = queryset.values_list("period", flat=True).distinct()

        return Response({"periods": res})
