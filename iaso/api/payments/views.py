from django.db.models import Count
import django_filters
from rest_framework import filters, permissions
from rest_framework.exceptions import NotFound
from hat.menupermissions import models as permission
from iaso.api.common import (
    HasPermission,
    ModelViewSet,
)
from iaso.models import Payment, OrgUnitChangeRequest, PotentialPayment, OrgUnit
import iaso.api.payments.filters as potential_payment_filters
from .serializers import PotentialPaymentSerializer


class PotentialPaymentsViewSet(ModelViewSet):
    """Potential Payments API

    This API is restricted to authenticated users.

    GET /api/potential_payments/
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.PAYMENTS)]
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
        potential_payment_filters.UsersFilterBackend,
        potential_payment_filters.UserRolesFilterBackend,
        potential_payment_filters.FormsFilterBackend,
        potential_payment_filters.ParentFilterBackend,
        potential_payment_filters.StartEndDateFilterBackend,
    ]
    ordering_fields = [
        "user__username",
        "user__last_name",
        "user__first_name",
        "created_at",
        "updated_at",
        "status",
        "created_by__username",
        "updated_by__username",
        "change_requests",
    ]
    serializer_class = PotentialPaymentSerializer

    results_key = "results"
    http_method_names = ["get", "head", "options", "trace"]

    def get_queryset(self):
        queryset = PotentialPayment.objects.all()
        queryset = queryset.prefetch_related(
            "change_requests",
        )
        queryset = queryset.filter(
            change_requests__created_by__iaso_profile__account=self.request.user.iaso_profile.account
        ).distinct()

        return queryset

    def retrieve(self, request, *args, **kwargs):
        raise NotFound("Retrieve operation is not allowed.")

    def list(self, request):
        orders = request.GET.get("order", "user__last_name").split(",")

        users_with_change_requests = (
            OrgUnitChangeRequest.objects.filter(status=OrgUnitChangeRequest.Statuses.APPROVED)
            .values("created_by")
            .annotate(num_requests=Count("created_by"))
            .filter(num_requests__gt=0)
        )

        for user in users_with_change_requests:
            change_requests = OrgUnitChangeRequest.objects.filter(
                created_by_id=user["created_by"],
                status=OrgUnitChangeRequest.Statuses.APPROVED,
            )
            if change_requests.exists():
                potential_payment, created = PotentialPayment.objects.get_or_create(
                    user_id=user["created_by"],
                )
                for change_request in change_requests:
                    if not Payment.objects.filter(change_requests__id=change_request.id).exists():
                        potential_payment.change_requests.add(change_request)
                potential_payment.save()
        queryset = self.filter_queryset(self.get_queryset()).order_by(*orders)
        return super().list(request, queryset)
