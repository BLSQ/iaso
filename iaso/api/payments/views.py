from typing import Dict, Tuple

import django_filters

from django.db import models, transaction
from django.db.models import Count, OuterRef, Prefetch, Q, Subquery
from django.db.models.functions import Coalesce
from django.http import HttpResponse, StreamingHttpResponse
from django.utils.translation import gettext as _
from drf_yasg import openapi
from drf_yasg.utils import swagger_auto_schema
from rest_framework import filters, permissions, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from hat.api.export_utils import Echo, generate_xlsx, iter_items
from hat.audit.audit_mixin import AuditMixin
from hat.audit.models import PAYMENT_API, PAYMENT_LOT_API
from hat.menupermissions import models as permission
from iaso.api.common import DropdownOptionsListViewSet, DropdownOptionsSerializer, HasPermission, ModelViewSet
from iaso.api.payments.filters import (
    payments_lots as payments_lots_filters,
    potential_payments as potential_payments_filters,
)
from iaso.api.tasks.serializers import TaskSerializer
from iaso.models import OrgUnitChangeRequest, Payment, PaymentLot, PotentialPayment
from iaso.models.org_unit import OrgUnit
from iaso.models.payments import PaymentStatuses
from iaso.tasks.create_payment_lot import create_payment_lot
from iaso.tasks.payments_bulk_update import mark_payments_as_read

from .serializers import (
    PaymentAuditLogger,
    PaymentLotAuditLogger,
    PaymentLotCreateSerializer,
    PaymentLotSerializer,
    PaymentSerializer,
    PotentialPaymentSerializer,
)


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

    The status is computed every time a payment is updated, ensuring that the payment lot status accurately reflects the current state of its associated payments.

    Audit (logs) is handled with a custom serializer instead of the `AuditMixin` because we have nested payments, the saving flow is not straightforward because of the link between the `PaymentLot`'s  status
    and the statuses its `payments`. Because of the many DB writes that audit logging introduces, all computations that imply a bulk update have been moved to a `Task` so they can be handled by the worker and avoid slowing the server down too much:
    - create:
        - creates several `Payment` from `PotentialPayment` and updates all `OrgUnitChangeRequest` linked to each `Payment`
        - `PaymentLog` is logged once on creation, before the task is launched, and a second time once the task has run and all data is up to date
        - Each `Payment` is logged when created
        - For each `Payment`, all its associated `OrgUnitChangeRequest` are logged once the foreign key has been set
    - update:
       - if `mark_payments_as_sent` True, all `Payment` are updated through a task, as well as the `PaymentLot` itself. All logging is done within the `Task`
       - else, only the `PaymentLot` is logged, in the `update` method
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
    ordering_fields = [
        "name",
        "created_at",
        "created_by__username",
        "status",
        "change_requests_count",
        "payments_count",
    ]

    ordering = ["updated_at"]
    serializer_class = PaymentLotSerializer
    http_method_names = ["get", "post", "patch", "head", "options", "trace"]

    def get_queryset(self):
        payments = (
            Payment.objects.filter(created_by__iaso_profile__account=self.request.user.iaso_profile.account)
            .values_list("payment_lot_id", flat=True)
            .distinct()
        )
        queryset = PaymentLot.objects.filter(id__in=payments)

        change_requests_prefetch = Prefetch(
            "payments__change_requests",
            queryset=OrgUnitChangeRequest.objects.all(),
            to_attr="prefetched_change_requests",
        )
        queryset = queryset.prefetch_related("payments", change_requests_prefetch)

        change_requests_count = (
            OrgUnitChangeRequest.objects.filter(payment__payment_lot=OuterRef("pk"))
            .order_by()
            .distinct()
            .values("payment__payment_lot")
            .annotate(total=Count("id", distinct=True))
            .values("total")
        )

        payments_count = (
            Payment.objects.filter(payment_lot=OuterRef("pk"))
            .order_by()
            .distinct()
            .values("payment_lot")
            .annotate(total=Count("id", distinct=True))
            .values("total")
        )

        queryset = queryset.annotate(
            change_requests_count=Coalesce(Subquery(change_requests_count, output_field=models.IntegerField()), 0),
            payments_count=Coalesce(Subquery(payments_count, output_field=models.IntegerField()), 0),
        )
        queryset = queryset.filter(created_by__iaso_profile__account=self.request.user.iaso_profile.account).distinct()

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
        queryset = self.filter_queryset(self.get_queryset())
        return super().list(request, queryset)

    @swagger_auto_schema(
        responses={status.HTTP_200_OK: PaymentLotSerializer()},
        manual_parameters=[
            openapi.Parameter(
                name="mark_payments_as_sent",
                in_=openapi.IN_QUERY,
                description="If set to true, all related payments will be marked as sent",
                type=openapi.TYPE_BOOLEAN,
            ),
        ],
    )
    def update(self, request, *args, **kwargs):
        with transaction.atomic():
            partial = kwargs.pop("partial", False)
            instance = self.get_object()
            audit_logger = PaymentLotAuditLogger()
            old_data = audit_logger.serialize_instance(instance)
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)

            mark_as_sent = request.query_params.get("mark_payments_as_sent", "false").lower() == "true"
            if not mark_as_sent:
                audit_logger.log_modification(instance=instance, old_data_dump=old_data, request_user=request.user)
                return Response(serializer.data)
            # the mark_as_sent query_param is used to only update related_payments' statuses, so we don't perform any other update when it's true
            if mark_as_sent:
                task = mark_payments_as_read(payment_lot_id=instance.pk, api=PAYMENT_LOT_API, user=request.user)
                instance.task = task
                instance.save()
                return Response(
                    {"task": TaskSerializer(instance=task).data},
                    status=status.HTTP_201_CREATED,
                )

    @swagger_auto_schema(
        request_body=PaymentLotCreateSerializer,
        responses={status.HTTP_201_CREATED: PaymentLotSerializer()},
    )
    def create(self, request):
        # with transaction.atomic():
        # Extract user, name, comment, and potential_payments IDs from request data
        user = self.request.user
        name = request.data.get("name")
        comment = request.data.get("comment")
        potential_payment_ids = request.data.get("potential_payments", [])  # Expecting a list of IDs
        potential_payment_ids = [int(pp_id) for pp_id in potential_payment_ids]
        # TODO move this in valdate method
        if not potential_payment_ids:
            raise ValidationError("At least one potential payment required")
        potential_payments = PotentialPayment.objects.filter(id__in=potential_payment_ids)
        task = create_payment_lot(user=user, name=name, potential_payment_ids=potential_payment_ids, comment=comment)
        # Assign task to potential payments to avoid racing condition when calling potential payments API
        for potential_payment in potential_payments:
            if potential_payment.task is None:
                potential_payment.task = task
                potential_payment.save()

        # Return the created Task
        return Response(
            {"task": TaskSerializer(instance=task).data},
            status=status.HTTP_201_CREATED,
        )

    def retrieve(self, request, *args, **kwargs):
        csv_format = bool(request.query_params.get("csv"))
        xlsx_format = bool(request.query_params.get("xlsx"))

        if csv_format or xlsx_format:
            payment_lot = self.get_object()

            payments = (
                payment_lot.payments.all()
                .select_related("user__iaso_profile")
                .prefetch_related("change_requests__org_unit")
                .prefetch_related("change_requests__new_reference_instances__form")
                .annotate(
                    annotated_count_org_unit_creation=Count(
                        "change_requests__kind",
                        filter=Q(change_requests__kind=OrgUnitChangeRequest.Kind.ORG_UNIT_CREATION),
                    ),
                    annotated_count_org_unit_change=Count(
                        "change_requests__kind",
                        filter=Q(change_requests__kind=OrgUnitChangeRequest.Kind.ORG_UNIT_CHANGE),
                    ),
                )
                .order_by("-id")
            )

            forms, forms_count_by_payment = self._get_dynamic_form_columns(payments)

            if csv_format:
                return self.retrieve_to_csv(payment_lot, payments, forms, forms_count_by_payment)
            if xlsx_format:
                return self.retrieve_to_xlsx(payment_lot, payments, forms, forms_count_by_payment)

        return super().retrieve(request, *args, **kwargs)

    def _get_dynamic_form_columns(
        self, payments: models.QuerySet[Payment]
    ) -> Tuple[Dict[int, str], Dict[int, Dict[int, int]]]:
        """
        The export should allow to count the number of forms,
        because some changes are paid while others are not.

        This function returns a tuple of two dictionaries:

        - the first one lists all forms:
            {form_id: form_name}

        - the second one counts forms by payment:
            {payment_id: {form_id: form_count}}

        These two dictionaries allow to add columns dynamically.
        """
        forms = {}
        forms_count_by_payment = {}
        for payment in payments:
            forms_count_by_payment[payment.id] = {}
            for change_request in payment.change_requests.all():
                for instance in change_request.new_reference_instances.all():
                    forms[instance.form.id] = instance.form.name
                    forms_count_by_payment[payment.id].setdefault(instance.form.id, 0)
                    forms_count_by_payment[payment.id][instance.form.id] += 1

        forms_sorted_by_names = dict(sorted(forms.items(), key=lambda item: item[1]))
        return forms_sorted_by_names, forms_count_by_payment

    def _get_table_row(self, payment, forms, forms_count_by_payment):
        change_requests = {
            cr.id: f"ID: {cr.id}, Org Unit: {cr.org_unit.name} (ID: {cr.org_unit.id})"
            for cr in payment.change_requests.all()
        }
        change_requests_sorted_by_id = dict(sorted(change_requests.items()))
        change_requests_str = "\n".join(change_requests_sorted_by_id.values())
        change_requests_count = payment.change_requests.count()

        row = [
            str(payment.id),
            payment.status,
            str(payment.user.id),
            payment.user.username,
            (
                payment.user.iaso_profile.phone_number.as_e164
                if payment.user.iaso_profile and payment.user.iaso_profile.phone_number
                else None
            ),
            payment.user.last_name,
            payment.user.first_name,
            change_requests_str,
            str(change_requests_count),
            payment.annotated_count_org_unit_creation,
            payment.annotated_count_org_unit_change,
        ]

        counts_by_forms = [forms_count_by_payment[payment.id].get(form_id, 0) for form_id in forms.keys()]
        row += counts_by_forms

        return row

    def retrieve_to_csv(self, payment_lot, payments, forms, forms_count_by_payment):
        columns = [
            _("ID"),
            _("Status"),
            _("User ID"),
            _("User Username"),
            _("User Phone"),
            _("User Last Name"),
            _("User First Name"),
            _("Change Requests"),
            _("Total Change Requests Count"),
            _("Org Unit Creation Count"),
            _("Org Unit Change Count"),
        ]
        for form_name in forms.values():
            columns.append(_("Form: %(name)s") % {"name": form_name})

        response = StreamingHttpResponse(
            streaming_content=(
                iter_items(
                    payments,
                    Echo(),
                    columns,
                    lambda payment: self._get_table_row(payment, forms, forms_count_by_payment),
                )
            ),
            content_type="text/csv",
        )
        response["Content-Disposition"] = f'attachment; filename="{payment_lot.name}_payments.csv"'
        return response

    def retrieve_to_xlsx(self, payment_lot, payments, forms, forms_count_by_payment):
        columns = [
            {"title": _("ID"), "width": 10},
            {"title": _("Status"), "width": 10},
            {"title": _("User ID"), "width": 10},
            {"title": _("User Username"), "width": 20},
            {"title": _("User Phone"), "width": 20},
            {"title": _("User Last Name"), "width": 20},
            {"title": _("User First Name"), "width": 20},
            {"title": _("Change Requests"), "width": 40},
            {"title": _("Total Change Requests Count"), "width": 20},
            {"title": _("Org Unit Creation Count"), "width": 20},
            {"title": _("Org Unit Change Count"), "width": 20},
        ]
        for form_name in forms.values():
            columns.append({"title": _("Form: %(name)s") % {"name": form_name}, "width": 15})

        response = HttpResponse(
            generate_xlsx(
                f"{payment_lot.name}_Payments",
                columns,
                payments,
                lambda payment, row_num: self._get_table_row(payment, forms, forms_count_by_payment),
            ),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = f'attachment; filename="{payment_lot.name}_payments.xlsx"'
        return response


class PotentialPaymentsViewSet(ModelViewSet, AuditMixin):
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
        "user__iaso_profile__phone_number",
        "created_at",
        "updated_at",
        "status",
        "created_by__username",
        "updated_by__username",
        "change_requests_count",
    ]

    ordering = ["user__last_name"]

    serializer_class = PotentialPaymentSerializer

    results_key = "results"
    http_method_names = ["get", "head", "options", "trace"]

    def get_queryset(self):
        queryset = (
            PotentialPayment.objects.prefetch_related("change_requests")
            .prefetch_related("change_requests__org_unit")
            .filter(change_requests__created_by__iaso_profile__account=self.request.user.iaso_profile.account)
            # Filter out potential payments already linked to a task as this means there's a task running converting them into Payment
            .filter(task__isnull=True)
            .distinct()
        )

        queryset = queryset.annotate(change_requests_count=Count("change_requests"))

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
                created_by_id=user["created_by"],
                status=OrgUnitChangeRequest.Statuses.APPROVED,
                payment__isnull=True,
                # Filter out potential payments with task as they are being converted to payments
                potential_payment__task__isnull=True,
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


class PaymentsViewSet(ModelViewSet):
    """
    # `Payment` API

    This API allows to list and update Payments.

    When updating, the status of the linked `PaymentLot` is recalculated and updated if necessary.

    Changes are logged in a `Modification`. If the `PaymentLot` status changed as well, it is logged in a separate `Modification`


    ## Permissions

    - User must be authenticated
    - User needs `iaso_payments` permission

    """

    http_method_names = ["patch", "get", "options"]
    results_key = "results"
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated, HasPermission(permission.PAYMENTS)]

    def get_queryset(self) -> models.QuerySet:
        user = self.request.user
        localisation = user.iaso_profile.org_units
        queryset = Payment.objects.filter(
            created_by__iaso_profile__account=self.request.user.iaso_profile.account
        ).prefetch_related("change_requests__org_unit")
        if localisation:
            authorized_org_units = OrgUnit.objects.filter_for_user(user)
            queryset = queryset.filter(change_requests__org_unit__in=authorized_org_units)
        return queryset

    def update(self, request, *args, **kwargs):
        with transaction.atomic():
            partial = kwargs.pop("partial", False)
            audit_payment = PaymentAuditLogger()
            audit_payment_lot = PaymentLotAuditLogger()
            instance = self.get_object()
            # save old data for audit
            payment_lot = instance.payment_lot
            old_payment = audit_payment.serialize_instance(instance)
            old_payment_lot = audit_payment_lot.serialize_instance(payment_lot)
            # update and log Payment
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            audit_payment.log_modification(old_data_dump=old_payment, instance=instance, request_user=request.user)
            # Check if Payment Lot needs to be updated and log change if necessary
            old_payment_lot_status = payment_lot.status
            new_payment_lot_status = payment_lot.compute_status()
            if old_payment_lot_status != new_payment_lot_status:
                payment_lot.status = new_payment_lot_status
                payment_lot.save()
                audit_payment_lot.log_modification(
                    instance=payment_lot,
                    old_data_dump=old_payment_lot,
                    request_user=request.user,
                    source=PAYMENT_API,
                )
            return Response(serializer.data)


class PaymentOptionsViewSet(DropdownOptionsListViewSet):
    permission_classes = [IsAuthenticatedOrReadOnly]
    http_method_names = ["get"]
    serializer = DropdownOptionsSerializer
    choices = PaymentStatuses
