from rest_framework import serializers

from iaso.models import Payment, PotentialPayment, OrgUnitChangeRequest
from django.contrib.auth.models import User
from iaso.api.payments.pagination import PaymentPagination

from ..common import TimestampField


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]
        ref_name = "UserNestedSerializerForPayment"


class OrgChangeRequestrNestedSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrgUnitChangeRequest
        fields = [
            "id",
            "uuid",
            "org_unit_id",
        ]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id", "status", "created_at", "updated_at", "created_by", "updated_by", "user", "change_requests"]
        read_only_fields = ["id", "created_at", "updated_at"]

    pagination_class = PaymentPagination
    created_by = UserNestedSerializer()
    updated_by = UserNestedSerializer()
    user = UserNestedSerializer()
    change_requests = OrgChangeRequestrNestedSerializer(many=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)


class PotentialPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PotentialPayment
        fields = ["id", "user", "change_requests"]
        read_only_fields = ["id", "created_at", "updated_at"]

    pagination_class = PaymentPagination
    user = UserNestedSerializer()
    change_requests = OrgChangeRequestrNestedSerializer(many=True)
