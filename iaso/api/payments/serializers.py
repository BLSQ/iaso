from rest_framework import serializers

from hat.audit.audit_logger import AuditLogger
from hat.audit.models import PAYMENT_API, PAYMENT_LOT_API, Modification
from iaso.models import Payment, PotentialPayment, OrgUnitChangeRequest, PaymentLot
from iaso.api.payments.filters.potential_payments import filter_by_forms, filter_by_dates, filter_by_parent

from django.contrib.auth.models import User
from iaso.api.payments.pagination import PaymentPagination
from iaso.models.base import Task

from ..common import TimestampField


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]
        ref_name = "UserNestedSerializerForPayment"


class OrgChangeRequestNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnitChangeRequest
        fields = ["id", "uuid", "org_unit_id"]
        read_only_fields = ["id", "updated_at"]


class PaymentSerializer(serializers.ModelSerializer):
    change_requests = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ["id", "status", "created_at", "updated_at", "created_by", "updated_by", "user", "change_requests"]
        read_only_fields = ["id", "created_at", "updated_at"]

    pagination_class = PaymentPagination
    created_by = UserNestedSerializer()
    updated_by = UserNestedSerializer()
    user = UserNestedSerializer()
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def get_change_requests(self, obj):
        change_requests = OrgUnitChangeRequest.objects.filter(payment=obj)
        return OrgChangeRequestNestedSerializer(change_requests, many=True, context=self.context).data


class NestedPaymentSerializer(serializers.ModelSerializer):
    change_requests = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = ["id", "change_requests", "user", "status"]
        read_only_fields = ["id"]

    user = UserNestedSerializer()

    def get_change_requests(self, obj):
        change_requests = OrgUnitChangeRequest.objects.filter(payment=obj)
        return OrgChangeRequestNestedSerializer(change_requests, many=True, context=self.context).data


class NestedTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "status", "ended_at"]


class PaymentLotSerializer(serializers.ModelSerializer):
    payments = serializers.SerializerMethodField()
    task = NestedTaskSerializer(read_only=True)

    class Meta:
        model = PaymentLot
        fields = ["id", "name", "status", "created_at", "created_by", "payments", "comment", "task"]
        read_only_fields = ["id", "created_at"]

    pagination_class = PaymentPagination
    created_by = UserNestedSerializer()
    created_at = TimestampField(read_only=True)

    def get_payments(self, obj):
        payments = obj.payments.all()
        return NestedPaymentSerializer(payments, many=True, context=self.context).data


class PotentialPaymentSerializer(serializers.ModelSerializer):
    change_requests = serializers.SerializerMethodField()

    class Meta:
        model = PotentialPayment
        fields = ["id", "user", "change_requests", "payment_lot"]
        read_only_fields = ["id", "created_at", "updated_at", "payment_lot"]

    pagination_class = PaymentPagination
    user = UserNestedSerializer()

    def get_change_requests(self, obj):
        change_requests = OrgUnitChangeRequest.objects.filter(potential_payment=obj)
        request = self.context.get("request", None)
        change_requests = filter_by_forms(request, change_requests)
        change_requests = filter_by_parent(request, change_requests)
        if request:
            start_date = request.GET.get("change_requests__created_at_after", None)
            end_date = request.GET.get("change_requests__created_at_before", None)
            change_requests = filter_by_dates(request, change_requests, start_date, end_date)
        return OrgChangeRequestNestedSerializer(change_requests, many=True).data


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
        if status not in Payment.Statuses:
            raise serializers.ValidationError("Invalid status")
        return status

    def get_change_requests(self, obj):
        change_requests = OrgUnitChangeRequest.objects.filter(payment=obj)
        return OrgChangeRequestNestedSerializer(change_requests, many=True).data

    def update(self, obj, validated_data):
        request = self.context["request"]
        user = obj.user
        request_user = request.user
        if user == request_user:
            raise serializers.ValidationError("Users cannot modify their own payments")
        payment = super().update(obj, validated_data)
        payment.updated_by = request_user
        payment.save()
        return payment


class AuditPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = "__all__"

    change_requests = OrgChangeRequestNestedSerializer(many=True)
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
