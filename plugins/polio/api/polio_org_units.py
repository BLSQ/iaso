from rest_framework import permissions

from iaso.api.common import ModelViewSet
from iaso.models import OrgUnit
from plugins.polio.api.shared_serializers import OrgUnitSerializer


class PolioOrgunitViewSet(ModelViewSet):
    """Org units API for Polio

    This API is use by polio plugin to fetch country related to an org unit. Read only

    GET /api/polio/orgunits
    """

    results_key = "results"
    permission_classes = [permissions.IsAuthenticated]
    remove_results_key_if_paginated = True
    http_method_names = ["get"]

    def get_serializer_class(self):
        return OrgUnitSerializer

    def get_queryset(self):
        return OrgUnit.objects.filter_for_user_and_app_id(self.request.user, self.request.query_params.get("app_id"))
