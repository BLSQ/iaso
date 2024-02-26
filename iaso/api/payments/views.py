from django.db.models import Count
from datetime import datetime
import django_filters
from django.utils import timezone
from django.db.models import Q
from rest_framework.exceptions import NotFound, ValidationError
from hat.menupermissions import models as permission
from iaso.api.common import (
    HasPermission,
    ModelViewSet,
)

import iaso.api.payments.filters as potential_payment_filters
from iaso.models import Payment, OrgUnitChangeRequest, PotentialPayment, OrgUnit
from rest_framework import filters, permissions
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
            # Get all approved change requests for this user that match the filter
            change_requests = OrgUnitChangeRequest.objects.filter(
                created_by_id=user["created_by"],
                status=OrgUnitChangeRequest.Statuses.APPROVED,
            )
            forms_ids = request.query_params.get("forms", None)
            start_date = request.query_params.get("change_requests__created_at_after", None)
            end_date = request.query_params.get("change_requests__created_at_before", None)
            parent_id = request.query_params.get("parent_id", None)

            date_format = "%d-%m-%Y"
            if forms_ids:
                forms_ids = [int(val) for val in forms_ids.split(",") if val.isnumeric()]
                change_requests = change_requests.filter(
                    org_unit__reference_instances__form_id__in=forms_ids,
                )
            if start_date:
                try:
                    start_date_dt = datetime.strptime(start_date, date_format)
                    start_date_dt = timezone.make_aware(start_date_dt, timezone.get_default_timezone())
                    start_date_dt = start_date_dt.replace(hour=0, minute=0, second=0)
                    change_requests = change_requests.filter(created_at__gte=start_date_dt)
                except ValueError:
                    pass

            if end_date:
                try:
                    end_date_dt = datetime.strptime(end_date, date_format)
                    end_date_dt = timezone.make_aware(end_date_dt, timezone.get_default_timezone())
                    end_date_dt = end_date_dt.replace(hour=23, minute=59, second=59)
                    change_requests = change_requests.filter(created_at__lte=end_date_dt)
                except ValueError:
                    pass
            if parent_id:
                try:
                    parent = OrgUnit.objects.get(id=parent_id)
                    parent_qs = OrgUnit.objects.filter(id=parent.id)
                    descendants_qs = OrgUnit.objects.hierarchy(parent_qs).values_list("id", flat=True)
                    change_requests = change_requests.filter(Q(org_unit__id__in=descendants_qs))
                except OrgUnit.DoesNotExist:
                    raise ValidationError({"parent_id": [f"OrgUnit with id {parent_id} does not exist."]})
            if change_requests.exists():
                # Create a PotentialPayment instance for the user
                potential_payment = PotentialPayment.objects.create(
                    user_id=user["created_by"],
                )
                # For each change request, check if a Payment already exists
                for change_request in change_requests:
                    if not Payment.objects.filter(change_requests__id=change_request.id).exists():
                        # If no Payment exists for the change request, add it to the PotentialPayment instance
                        potential_payment.change_requests.add(change_request)
                potential_payment.save()
        queryset = self.filter_queryset(self.get_queryset()).order_by(*orders)
        return super().list(request, queryset)
