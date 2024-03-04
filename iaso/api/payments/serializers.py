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
        fields = ["id", "uuid", "org_unit_id", "created_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

    # created_at = TimestampField(read_only=True)


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
        # Assuming OrgUnitChangeRequest has a reverse relation to Payment named 'change_requests'
        change_requests = OrgUnitChangeRequest.objects.filter(payment=obj)
        # Utilize the OrgChangeRequestNestedSerializer to serialize the queryset
        return OrgChangeRequestNestedSerializer(change_requests, many=True, context=self.context).data


class PaymentLotSerializer(serializers.ModelSerializer):
    payments = serializers.SerializerMethodField()

    class Meta:
        model = PaymentLot
        fields = ["id", "name", "status", "created_at", "updated_at", "created_by", "updated_by", "payments"]
        read_only_fields = ["id", "created_at", "updated_at"]

    pagination_class = PaymentPagination
    created_by = UserNestedSerializer()
    updated_by = UserNestedSerializer()
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)

    def get_payments(self, obj):
        payments = obj.payments.all()
        return PaymentSerializer(payments, many=True, context=self.context).data


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
