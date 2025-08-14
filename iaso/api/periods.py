from rest_framework import permissions, viewsets
from rest_framework.response import Response

import iaso.permissions as core_permissions

from iaso.models import Instance

from .common import HasPermission


class PeriodsViewSet(viewsets.ViewSet):
    f"""Periods API

    Note: only used to list periods for a specific form (the form_id query param is mandatory).

    This API is restricted to authenticated users having the "{core_permissions.FORMS}" or "{core_permissions.SUBMISSIONS}" permissions.

    GET /api/periods/?form_id=id
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(core_permissions.FORMS, core_permissions.SUBMISSIONS),  # type: ignore
    ]

    def list(self, request):
        form_id = request.GET.get("form_id", None)
        if not form_id:  # TODO: 400 Bad Request
            return Response({"res": "Problem: please provide a form id"})
        queryset = Instance.objects.filter(form__id=form_id)
        queryset = queryset.filter(period__isnull=False).order_by("period")
        res = queryset.values_list("period", flat=True).distinct()

        return Response({"periods": res})
