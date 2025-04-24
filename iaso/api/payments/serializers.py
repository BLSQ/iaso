from django.contrib.auth.models import User
from rest_framework import serializers

from hat.audit.audit_logger import AuditLogger
from hat.audit.models import PAYMENT_API, PAYMENT_LOT_API
from iaso.api.payments.filters.potential_payments import filter_by_dates, filter_by_forms, filter_by_parent
from iaso.api.payments.pagination import PaymentPagination
from iaso.models import OrgUnitChangeRequest, Payment, PaymentLot, PotentialPayment
from iaso.models.base import Task
from iaso.models.payments import PaymentStatuses

from ..common import TimestampField


class UserNestedSerializer(serializers.ModelSerializer):
    phone_number = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "phone_number"]
        ref_name = "UserNestedSerializerForPayment"

    def get_phone_number(self, obj):
        profile = getattr(obj, "iaso_profile", None)
        return profile.phone_number.as_e164 if profile and profile.phone_number else None


class OrgChangeRequestNestedSerializer(serializers.ModelSerializer):
    can_see_change_request = serializers.SerializerMethodField()

    class Meta:
        model = OrgUnitChangeRequest
        fields = ["id", "uuid", "org_unit_id", "can_see_change_request"]
        read_only_fields = ["id", "updated_at"]

    def get_can_see_change_request(self, obj):
        user = self.context.get("request").user
        if user.is_superuser:
            return True
        user_org_units = list(user.iaso_profile.get_hierarchy_for_user().values_list("id", flat=True))
        return obj.org_unit.id in user_org_units


class AuditOrgChangeRequestNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnitChangeRequest
        fields = ["id", "uuid", "org_unit_id"]
        read_only_fields = ["id", "updated_at"]


class NestedPaymentSerializer(serializers.ModelSerializer):
    change_requests = serializers.SerializerMethodField()
    can_see_change_requests = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ["id", "change_requests", "user", "status", "can_see_change_requests"]
        read_only_fields = ["id"]

    user = UserNestedSerializer()

    def get_change_requests(self, obj):
        change_requests = OrgUnitChangeRequest.objects.filter(payment=obj)
        return OrgChangeRequestNestedSerializer(change_requests, many=True, context=self.context).data

    def get_can_see_change_requests(self, obj):
        change_requests = self.get_change_requests(obj)

        blocked_change_requests = [
            change_request for change_request in change_requests if change_request["can_see_change_request"] == False
        ]
        if blocked_change_requests:
            return False
        return True


class NestedTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "status", "ended_at"]


class PaymentLotSerializer(serializers.ModelSerializer):
    payments = serializers.SerializerMethodField()
    task = NestedTaskSerializer(read_only=True)
    can_see_change_requests = serializers.SerializerMethodField()

    class Meta:
        model = PaymentLot
        fields = [
            "id",
            "name",
            "status",
            "created_at",
            "created_by",
            "payments",
            "comment",
            "task",
            "can_see_change_requests",
        ]
        read_only_fields = ["id", "created_at"]

    pagination_class = PaymentPagination
    created_by = UserNestedSerializer()
    created_at = TimestampField(read_only=True)

    def get_can_see_change_requests(self, obj):
        user = self.context.get("request").user
        if user.is_superuser:
            return True
        user_org_units = set(user.iaso_profile.get_hierarchy_for_user().values_list("id", flat=True))
        change_requests_org_units_for_lot = (
            OrgUnitChangeRequest.objects.filter(payment__in=obj.payments.all())
            .values_list("org_unit__id", flat=True)
            .distinct()
        )
        return set(change_requests_org_units_for_lot).issubset(user_org_units)

    def get_payments(self, obj):
        payments = obj.payments.all()
        return NestedPaymentSerializer(payments, many=True, context=self.context).data


class PotentialPaymentSerializer(serializers.ModelSerializer):
    change_requests = serializers.SerializerMethodField()
    can_see_change_requests = serializers.SerializerMethodField()

    class Meta:
        model = PotentialPayment
        fields = ["id", "user", "change_requests", "payment_lot", "can_see_change_requests"]
        read_only_fields = ["id", "payment_lot", "can_see_change_requests"]

    pagination_class = PaymentPagination
    user = UserNestedSerializer()

    def get_change_requests(self, obj):
        change_requests = obj.change_requests.all()
        request = self.context.get("request", None)
        change_requests = filter_by_forms(request, change_requests)
        change_requests = filter_by_parent(request, change_requests)
        if request:
            start_date = request.GET.get("change_requests__created_at_after", None)
            end_date = request.GET.get("change_requests__created_at_before", None)
            change_requests = filter_by_dates(request, change_requests, start_date, end_date)
        return OrgChangeRequestNestedSerializer(change_requests, many=True, context=self.context).data

    def get_can_see_change_requests(self, obj):
        change_requests = self.get_change_requests(obj)
        blocked_change_requests = [
            change_request for change_request in change_requests if change_request["can_see_change_request"] == False
        ]
        if blocked_change_requests:
            return False
        return True


class PaymentLotCreateSerializer(serializers.Serializer):
    name = serializers.CharField(help_text="Name of the payment lot")
    comment = serializers.CharField(help_text="Comment or description of the payment lot")
    potential_payments = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of IDs for potential payments to be included in the payment lot",
    )


class PaymentSerializer(serializers.ModelSerializer):
    change_requests = serializers.SerializerMethodField(read_only=True)
    user = UserNestedSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = "__all__"
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "change_requests",
            "user",
            "created_by",
            "payment_lot",
            "updated_by",
        ]

    pagination_class = PaymentPagination

    def validate_status(self, status):
        if status not in PaymentStatuses:
            raise serializers.ValidationError("Invalid status")
        return status

    def get_change_requests(self, obj):
        change_requests = OrgUnitChangeRequest.objects.filter(payment=obj)
        return OrgChangeRequestNestedSerializer(change_requests, many=True, context=self.context).data

    def update(self, obj, validated_data):
        payment = super().update(obj, validated_data)
        request = self.context["request"]
        user = request.user
        payment.updated_by = user
        payment.save()
        return payment


class AuditPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"

    change_requests = AuditOrgChangeRequestNestedSerializer(many=True)
    user = UserNestedSerializer()


class AuditPaymentLotSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentLot
        fields = "__all__"

    payments = AuditPaymentSerializer(required=False, many=True)


class PaymentLotAuditLogger(AuditLogger):
    serializer = AuditPaymentLotSerializer
    default_source = PAYMENT_LOT_API


class PaymentAuditLogger(AuditLogger):
    serializer = AuditPaymentSerializer
    default_source = PAYMENT_API
