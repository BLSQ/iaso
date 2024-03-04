from django.db.models import Count
import django_filters
from drf_yasg import openapi
from rest_framework import filters, permissions
from django.db.models.functions import Coalesce
from rest_framework.exceptions import NotFound
from rest_framework import status
from rest_framework.response import Response
from django.db import transaction
from django.db.models import Count, Subquery, OuterRef
from django.db import models

from hat.menupermissions import models as permission
from iaso.api.common import (
    HasPermission,
    ModelViewSet,
)
from iaso.models import Payment, OrgUnitChangeRequest, PotentialPayment, PaymentLot
import iaso.api.payments.filters.potential_payments as potential_payments_filters
import iaso.api.payments.filters.payments_lots as payments_lots_filters
from .serializers import PotentialPaymentSerializer, PaymentLotSerializer
from drf_yasg.utils import swagger_auto_schema


class PaymentLotsViewSet(ModelViewSet):
    """
    # `Payment Lots` API

    This API allows for the management and querying of payment lots. Payment lots are collections of payments that can be processed together.

    The Django model that stores "Payment Lot" is `PaymentLot`.

    This API supports creating new payment lots, updating existing ones, and querying for payment lots based on various criteria such as creation date, status, and associated user.

    ## Permissions

    - User must be authenticated
    - User needs `iaso_payments` permission

    ## Status Computing

    The status of a payment lot is dynamically computed based on the statuses of the payments it contains. The possible statuses are:

    - `new`: Default status, indicating a newly created lot or a lot with no payments sent.
    - `sent`: Indicates that all payments in the lot have been sent.
    - `paid`: Indicates that all payments in the lot have been paid.
    - `partially_paid`: Indicates that some, but not all, payments in the lot have been paid.

    The status is computed every time a payment lot is saved, ensuring that the payment lot status accurately reflects the current state of its associated payments.
    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.PAYMENTS)]
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
        payments_lots_filters.UsersFilterBackend,
        payments_lots_filters.ParentFilterBackend,
        payments_lots_filters.StartEndDateFilterBackend,
        payments_lots_filters.StatusFilterBackend,
    ]
    ordering_fields = ["name", "created_at", "created_by__username", "status", "change_requests_count"]
    serializer_class = PaymentLotSerializer
    http_method_names = ["get", "post", "patch", "head", "options", "trace"]

    def get_queryset(self):
        queryset = PaymentLot.objects.all()
        queryset = queryset.prefetch_related("payments")

        # Adjusted subquery to directly link and count OrgUnitChangeRequests through Payments
        change_requests_count = (
            OrgUnitChangeRequest.objects.filter(payment__payment_lot=OuterRef("pk"))
            .order_by()
            .values("payment__payment_lot")
            .annotate(total=Count("id"))
            .values("total")
        )

        queryset = queryset.annotate(
            change_requests_count=Coalesce(Subquery(change_requests_count, output_field=models.IntegerField()), 0)
        )

        queryset = queryset.filter(created_by__iaso_profile__account=self.request.user.iaso_profile.account).distinct()
        for payment_lot in queryset:
            print(f"PaymentLot ID: {payment_lot.id}, Change Requests Count: {payment_lot.change_requests_count}")

        return queryset

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                name="user",
                in_=openapi.IN_QUERY,
                description="A comma-separated list of User IDs associated with the payment lots creation",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                name="status",
                in_=openapi.IN_QUERY,
                description="A comma-separated list of the possible payment lot status",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                name="parent_id",
                in_=openapi.IN_QUERY,
                description="The ID of the parent organization unit linked to the change requests. This should also include child units.",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                name="created_at_after",
                in_=openapi.IN_QUERY,
                description="The start date for when the lots has been created. Format: YYYY-MM-DD",
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_DATE,
            ),
            openapi.Parameter(
                name="created_at_before",
                in_=openapi.IN_QUERY,
                description="The end date for when the lots has been created. Format: YYYY-MM-DD",
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_DATE,
            ),
        ]
    )
    def list(self, request):
        orders = request.GET.get("order", "updated_at").split(",")
        queryset = self.filter_queryset(self.get_queryset()).order_by(*orders)
        return super().list(request, queryset)

    def create(self, request):
        with transaction.atomic():
            # Extract name, comment, and potential_payments IDs from request data
            name = request.data.get("name")
            comment = request.data.get("comment")
            potential_payment_ids = request.data.get("potential_payments", [])  # Expecting a list of IDs

            # Create the PaymentLot instance but don't save it yet
            payment_lot = PaymentLot(name=name, comment=comment, created_by=request.user, updated_by=request.user)

            # Save the PaymentLot instance to ensure it has a primary key
            payment_lot.save()

            # Retrieve PotentialPayment instances by IDs
            potential_payments = PotentialPayment.objects.filter(id__in=potential_payment_ids)

            # For each potential payment, create a Payment instance in pending status
            for potential_payment in potential_payments:
                payment = Payment.objects.create(
                    status=Payment.Statuses.PENDING,
                    user=potential_payment.user,
                    created_by=request.user,
                    updated_by=request.user,
                    payment_lot=payment_lot,  # Now payment_lot has a primary key
                )
                # Add change requests from potential payment to the newly created payment
                for change_request in potential_payment.change_requests.all():
                    change_request.payment = payment
                    change_request.save()
                potential_payment.delete()

            # Return the created PaymentLot instance
            serializer = self.get_serializer(payment_lot)
            return Response(serializer.data, status=status.HTTP_201_CREATED)


class PotentialPaymentsViewSet(ModelViewSet):
    """
    # `Potential payment` API

    This API allows to list potential payments linked to multiple `OrgUnitChangeRequest` by the same user to be updated and queried.

    The Django model that stores "Potential payment" is `PotentialPayment`.

    Whenever the list endpoint is invoked, it evaluates whether a new change request can be incorporated into the potential payment, or if there's a need to generate a new potential payment.

    ## Permissions

    - User must be authenticated
    - User needs `iaso_payments` permission

    """

    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.PAYMENTS)]
    filter_backends = [
        filters.OrderingFilter,
        django_filters.rest_framework.DjangoFilterBackend,
        potential_payments_filters.UsersFilterBackend,
        potential_payments_filters.UserRolesFilterBackend,
        potential_payments_filters.FormsFilterBackend,
        potential_payments_filters.ParentFilterBackend,
        potential_payments_filters.StartEndDateFilterBackend,
        potential_payments_filters.SelectionFilterBackend,
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

    def calculate_new_potential_payments(self):
        users_with_change_requests = (
            OrgUnitChangeRequest.objects.filter(status=OrgUnitChangeRequest.Statuses.APPROVED)
            .values("created_by")
            .annotate(num_requests=Count("created_by"))
            .filter(num_requests__gt=0)
        )

        for user in users_with_change_requests:
            change_requests = OrgUnitChangeRequest.objects.filter(
                created_by_id=user["created_by"], status=OrgUnitChangeRequest.Statuses.APPROVED, payment__isnull=True
            )
            if change_requests.exists():
                potential_payment, created = PotentialPayment.objects.get_or_create(
                    user_id=user["created_by"],
                )
                for change_request in change_requests:
                    change_request.potential_payment = potential_payment
                    change_request.save()
                potential_payment.save()

    @swagger_auto_schema(auto_schema=None)
    def retrieve(self, request, *args, **kwargs):
        raise NotFound("Retrieve operation is not allowed.")

    @swagger_auto_schema(
        manual_parameters=[
            openapi.Parameter(
                name="users",
                in_=openapi.IN_QUERY,
                description="A comma-separated list of User IDs associated with the payments",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                name="user_roles",
                in_=openapi.IN_QUERY,
                description="A comma-separated list of User Role IDs associated with the payments",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                name="parent_id",
                in_=openapi.IN_QUERY,
                description="The ID of the parent organization unit linked to the change requests. This should also include child units.",
                type=openapi.TYPE_INTEGER,
            ),
            openapi.Parameter(
                name="change_requests__created_at_after",
                in_=openapi.IN_QUERY,
                description="The start date for when the change request has been validated. Format: YYYY-MM-DD",
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_DATE,
            ),
            openapi.Parameter(
                name="change_requests__created_at_before",
                in_=openapi.IN_QUERY,
                description="The end date for when the change request has been validated. Format: YYYY-MM-DD",
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_DATE,
            ),
            openapi.Parameter(
                name="select_all",
                in_=openapi.IN_QUERY,
                description="Select all potential payments from the query",
                type=openapi.TYPE_BOOLEAN,
            ),
            openapi.Parameter(
                name="selected_ids",
                in_=openapi.IN_QUERY,
                description="A comma-separated list of Potential Payments IDs selected to return from the query",
                type=openapi.TYPE_STRING,
            ),
            openapi.Parameter(
                name="unselected_ids",
                in_=openapi.TYPE_STRING,
                description="A comma-separated list of Potential Payments IDs to exlude from the query",
                type=openapi.TYPE_STRING,
            ),
        ]
    )
    def list(self, request):
        self.calculate_new_potential_payments()
        orders = request.GET.get("order", "user__last_name").split(",")
        queryset = self.filter_queryset(self.get_queryset()).order_by(*orders)
        return super().list(request, queryset)
