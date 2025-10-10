from rest_framework.permissions import IsAuthenticated

from iaso.api.common import (
    ModelViewSet,
)
from iaso.api.permission_checks import ReadOnly
from iaso.models.microplanning import Planning

from .serializers import MobilePlanningSerializer


class MobilePlanningViewSet(ModelViewSet):
    """Planning for mobile, contrary to the more general API.
    it only returns the Planning where the user has assigned OrgUnit
    and his assignments
    """

    remove_results_key_if_paginated = False
    results_key = "plannings"
    permission_classes = [IsAuthenticated, ReadOnly]
    serializer_class = MobilePlanningSerializer

    def get_queryset(self):
        user = self.request.user
        # Only return  planning which 1. contain assignment for user 2. are published 3. undeleted
        # distinct is necessary otherwise if a planning contain multiple assignment for the same user it got duplicated

        return (
            Planning.objects.filter(assignment__user=user, assignment__deleted_at__isnull=True)
            .exclude(published_at__isnull=True)
            .exclude(started_at__isnull=True)
            .exclude(ended_at__isnull=True)
            .filter(deleted_at__isnull=True)
            .distinct()
        )
