from rest_framework import serializers

from iaso.models import OrgUnit, Payment, PotentialPayment, OrgUnitChangeRequest, Instance
from django.contrib.auth.models import User
from iaso.api.payments.pagination import PaymentPagination

from ..common import TimestampField


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]
        ref_name = "UserNestedSerializerForPayment"


class InstanceForChangeRequestSerializer(serializers.ModelSerializer):
    """
    Used for nesting `Instance` instances.
    """

    form_name = serializers.CharField(source="form.name")
    values = serializers.JSONField(source="json")

    class Meta:
        model = Instance
        fields = [
            "id",
            "form_id",
            "form_name",
            "values",
        ]


class OrgUnitNestedSerializer(serializers.ModelSerializer):
    reference_instances = InstanceForChangeRequestSerializer(many=True)

    class Meta:
        model = OrgUnit
        fields = ["id", "name", "reference_instances"]
        ref_name = "OrgUnitNestedSerializerForChangeRequest"


class OrgChangeRequestNestedSerializer(serializers.ModelSerializer):
    org_unit = OrgUnitNestedSerializer()

    class Meta:
        model = OrgUnitChangeRequest
        fields = [
            "id",
            "uuid",
            "org_unit",
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
    change_requests = OrgChangeRequestNestedSerializer(many=True)
    created_at = TimestampField(read_only=True)
    updated_at = TimestampField(read_only=True)


class PotentialPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = PotentialPayment
        fields = ["id", "user", "change_requests"]
        read_only_fields = ["id", "created_at", "updated_at"]

    pagination_class = PaymentPagination
    user = UserNestedSerializer()
    change_requests = OrgChangeRequestNestedSerializer(many=True)
