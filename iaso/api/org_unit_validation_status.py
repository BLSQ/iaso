from rest_framework import viewsets, permissions
from rest_framework.response import Response


from iaso.models import OrgUnit


class ValidationStatusViewSet(viewsets.ViewSet):
    """Org unit validation status API

    This API is restricted to authenticated users.

    GET /api/validationstatus/
    """

    permission_classes = [permissions.IsAuthenticated]

    def list(self, _):
        return Response([status[0] for status in OrgUnit.VALIDATION_STATUS_CHOICES])
