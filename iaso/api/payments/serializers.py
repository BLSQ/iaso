from rest_framework import serializers

from iaso.models import Payment
from django.contrib.auth.models import User
from iaso.api.payments.pagination import PaymentPagination

from ..common import TimestampField

class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]
        ref_name = "UserNestedSerializerForPayment"



class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = ["id","status", "created_at", "updated_at", "created_by", "updated_by", "user"]
        read_only_fields = ["id", "created_at", "updated_at"]
    pagination_class = PaymentPagination
    created_by = UserNestedSerializer()
    updated_by = UserNestedSerializer()
    user = UserNestedSerializer()
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)
