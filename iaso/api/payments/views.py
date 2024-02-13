from drf_yasg.utils import swagger_auto_schema, no_body
from hat.menupermissions import models as permission
from iaso.api.common import (
    HasPermission,
    ModelViewSet,
)
from iaso.models import Payment, OrgUnitChangeRequest
from rest_framework import filters, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import PaymentSerializer
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
    results_key = "results"
    http_method_names = ["get", "post" "head", "options", "trace"]

    def get_queryset(self):
        #"""Always filter the base queryset by account"""

        return Payment.objects.all()
        # TODO: check if we have to limit payment per Account
        # return Payment.objects.filter(account=self.request.user.iaso_profile.account)

    @swagger_auto_schema(request_body=no_body)
    @action(detail=False, methods=["get"], url_path="getpayments")
    def get_payments(self, request):
        """
        This endpoint retrieves all users who have approved change requests and processes payments for them.

        For each user with approved change requests, it checks if a pending payment already exists. 

        If it does, it updates the existing payment.

        If it doesn't, it creates a new payment.

        It then goes through each of the user's approved change requests. 
        
        If a change request is not already associated with the payment, it adds the change request to the payment.

        The endpoint returns a count of new payments created and existing payments modified.

        """


        # Counters for new and modified payments
        new_payments = 0
        modified_payments = 0

        # Get all users who have approved change requests
        users_with_change_requests = OrgUnitChangeRequest.objects.filter(status=OrgUnitChangeRequest.Statuses.APPROVED).values('created_by').annotate(
            num_requests=Count('created_by')).filter(num_requests__gt=0)

        for user in users_with_change_requests:
            # Get all approved change requests for this user
            change_requests = OrgUnitChangeRequest.objects.filter(created_by_id=user['created_by'], status=OrgUnitChangeRequest.Statuses.APPROVED)

            # Check if a pending payment already exists for this user
            existing_payment = Payment.objects.filter(user_id=user['created_by'], status=Payment.Statuses.PENDING).first()

            if existing_payment:
                # If a pending payment exists, use it
                payment = existing_payment
                payment.updated_by = request.user  # Set updated_by to the current user
                payment.save()
            else:
                # If no pending payment exists, create a new one
                payment = Payment(user_id=user['created_by'], status=Payment.Statuses.PENDING, created_by=request.user)
                payment.save()
                new_payments += 1  # Increment the new payments counter

            for change_request in change_requests:
                # Check if this change request is already in the payment
                if not payment.change_requests.filter(id=change_request.id).exists():
                    # If not, add this change request to the payment
                    payment.change_requests.add(change_request)
                    if existing_payment:
                        modified_payments += 1  # Increment the modified payments counter

        return Response({"new_payments": new_payments, "modified_payments": modified_payments})
