from django.db.models import Count
import django_filters
from drf_yasg import openapi
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
from drf_yasg.utils import swagger_auto_schema


class PotentialPaymentsViewSet(ModelViewSet):
    """
    # `Potential payment` API

    This API allows to list potential payments linked to multiple `OrgUnitChangeRequest` by the same user to be updated and queried.

    The Django model that stores "Potential payment" is `PotentialPayment`.

    Whenever the list endpoint is invoked, it evaluates whether a new change request can be incorporated into the potential payment, or if there's a need to generate a new potential payment.

    ## Permissions

    - User must be authenticated
    - User needs `iaso_payments` permission

    ## Possible responses

    ### 200 - OK

    ### 400 - Bad request

    - `page` or `limit` cannot be parsed to a correct integer value

    ### 401 - Unauthorized

    - No authentication token or an invalid one was provided

    ### 403 - Forbidden

    - User doesn't have the proper permission to access this resource.


    ### 404 - Not found

    - `users`, `user_roles`, `parent_id` not found

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
        return (
            PotentialPayment.objects.prefetch_related("change_requests")
            .filter(change_requests__created_by__iaso_profile__account=self.request.user.iaso_profile.account)
            .distinct()
        )

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
        ]
    )
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
        queryset = self.filter_queryset(self.get_queryset())
        return super().list(request, queryset)
