from rest_framework import viewsets, permissions
from rest_framework.response import Response

from iaso.models import Instance
from .common import HasPermission
from hat.menupermissions import models as permission


class PeriodsViewSet(viewsets.ViewSet):
    f"""Periods API

    Note: only used to list periods for a specific form (the form_id query param is mandatory).

    This API is restricted to authenticated users having the "{permission.FORMS}" or "{permission.SUBMISSIONS}" permissions.

    GET /api/periods/?form_id=id
    """

    permission_classes = [
        permissions.IsAuthenticated,
        HasPermission(permission.FORMS, permission.SUBMISSIONS),  # type: ignore
    ]

    def list(self, request):
        form_id = request.GET.get("form_id", None)
        if not form_id:  # TODO: 400 Bad Request
            return Response({"res": "Problem: please provide a form id"})
        queryset = Instance.objects.filter(form__id=form_id)
        queryset = queryset.filter(period__isnull=False).order_by("period")
        res = queryset.values_list("period", flat=True).distinct()

        return Response({"periods": res})
