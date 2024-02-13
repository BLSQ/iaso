from rest_framework import filters, permissions
import django_filters

from iaso.models import Payment
from .serializers import PaymentSerializer
from ..common import ModelViewSet


class PaymentsViewSet(ModelViewSet):
    """Payments API

    This API is restricted to authenticated users.

    GET /api/payments/
    GET /api/payments/<id>
    """

    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter, django_filters.rest_framework.DjangoFilterBackend]
    ordering_fields = [
        "user__username",
        "created_at",
        "updated_at",
        "status",
        "created_by__username",
        "updated_by__username",
    ]
    serializer_class = PaymentSerializer
    results_key = "results"
    http_method_names = ["get", "head", "options", "trace"]

    def get_queryset(self):
        """Always filter the base queryset by account"""

        return Payment.objects.all()
        # return Payment.objects.filter(account=self.request.user.iaso_profile.account)
