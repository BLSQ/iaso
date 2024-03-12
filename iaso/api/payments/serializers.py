from rest_framework import serializers

from iaso.models import Payment, PotentialPayment, OrgUnitChangeRequest, PaymentLot
from iaso.api.payments.filters.potential_payments import filter_by_forms, filter_by_dates, filter_by_parent

from django.contrib.auth.models import User
from iaso.api.payments.pagination import PaymentPagination

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


class PaymentLotSerializer(serializers.ModelSerializer):
    payments = serializers.SerializerMethodField()

    class Meta:
        model = PaymentLot
        fields = ["id", "name", "status", "created_at", "created_by", "payments"]
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
        fields = ["id", "user", "change_requests"]
        read_only_fields = ["id", "created_at", "updated_at"]

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
