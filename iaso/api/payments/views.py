from drf_yasg.utils import swagger_auto_schema, no_body
from hat.menupermissions import models as permission
from iaso.api.common import (
    HasPermission,
    ModelViewSet,
)
from iaso.models import Payment, OrgUnitChangeRequest, PotentialPayment
from rest_framework import filters, permissions
from rest_framework.decorators import action
from .serializers import PaymentSerializer, PotentialPaymentSerializer
import django_filters
from django.db.models import Count


class PaymentsViewSet(ModelViewSet):
    """Payments API

    This API is restricted to authenticated users.

    GET /api/payments/
    GET /api/payments/<id>
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.PAYMENTS)]
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

    def get_serializer_class(self):
        if self.action == "get_potential_payments":
            return PotentialPaymentSerializer
        return super().get_serializer_class()

    def get_ordering_fields(self):
        if self.action == "get_potential_payments":
            return ["user__username", "status", "change_requests", "payment"]
        return super().get_ordering_fields()

    results_key = "results"
    http_method_names = ["get", "post" "head", "options", "trace"]

    def get_queryset(self):
        # """Always filter the base queryset by account"""

        return Payment.objects.all()
        # TODO: check if we have to limit payment per Account
        # return Payment.objects.filter(account=self.request.user.iaso_profile.account)

    """
    This endpoint retrieves all users who have approved change requests and processes payments for them.

    For each user with approved change requests, it checks if a pending payment already exists. 

    If it does, it updates the existing payment.

    If it doesn't, it creates a new payment.

    It then goes through each of the user's approved change requests. 
    
    If a change request is not already associated with the payment, it adds the change request to the payment.

    The endpoint returns a count of new payments created and existing payments modified.

    """

    @swagger_auto_schema(request_body=no_body)
    @action(detail=False, methods=["get"], url_path="get_potential_payments")
    def get_potential_payments(self, request):
        # Clear out old potential payments
        PotentialPayment.objects.all().delete()

        # Get all users who have approved change requests
        users_with_change_requests = (
            OrgUnitChangeRequest.objects.filter(status=OrgUnitChangeRequest.Statuses.APPROVED)
            .values("created_by")
            .annotate(num_requests=Count("created_by"))
            .filter(num_requests__gt=0)
        )

        for user in users_with_change_requests:
            # Get all approved change requests for this user
            change_requests = OrgUnitChangeRequest.objects.filter(
                created_by_id=user["created_by"], status=OrgUnitChangeRequest.Statuses.APPROVED
            )

            # Create a new PotentialPayment instance for each user
            potential_payment = PotentialPayment.objects.create(
                user_id=user["created_by"],
            )
            # For each change request, check if a Payment already exists
            for change_request in change_requests:
                if not Payment.objects.filter(change_requests__id=change_request.id).exists():
                    # If no Payment exists for the change request, add it to the PotentialPayment instance
                    potential_payment.change_requests.add(change_request)

        # Use the built-in list method of ModelViewSet which handles ordering and pagination
        return self.list(request, queryset=PotentialPayment.objects.all())
