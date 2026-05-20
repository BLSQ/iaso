import decimal

from rest_framework import serializers

import iaso.periods as periods

from iaso.api.comment import UserSerializerForComment
from iaso.api.common import TimestampField
from iaso.api.serializers import OrgUnitSerializer
from iaso.models import Instance, InstanceLock, OrgUnit
from iaso.utils.file_utils import get_file_type
from iaso.utils.serializer.rounded_decimal_field import RoundedDecimalField


class InstanceImportAccuracySerializer(serializers.Serializer):
    accuracy = RoundedDecimalField(
        coerce_max_value=99999,
        max_digits=None,
        decimal_places=2,
        rounding=decimal.ROUND_HALF_UP,
        allow_null=True,
        required=False,
    )


class FileTypeSerializer(serializers.Serializer):
    image_only = serializers.BooleanField(default=False)
    video_only = serializers.BooleanField(default=False)
    document_only = serializers.BooleanField(default=False)
    other_only = serializers.BooleanField(default=False)


class InstanceFileSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    file = serializers.FileField(use_url=True)
    file_type = serializers.SerializerMethodField()
    name = serializers.CharField(read_only=True)

    def get_file_type(self, obj):
        return get_file_type(obj.file)


class InstanceSerializer(serializers.ModelSerializer):
    org_unit = serializers.PrimaryKeyRelatedField(queryset=OrgUnit.objects.all())
    period = serializers.CharField(max_length=9, allow_blank=True)

    class Meta:
        model = Instance
        fields = ["org_unit", "period", "deleted", "last_modified_by"]

    def validate_org_unit(self, value):
        """Check if user has access to this org_unit."""
        # Prevent IA-928: Don't revalidate org unit if it's not modified. As the allowed Type on form or the type
        #  on the org unit can change
        if self.instance and self.instance.org_unit == value:
            return value
        if value.org_unit_type in self.instance.form.org_unit_types.all():
            try:
                return OrgUnit.objects.filter_for_user_and_app_id(self.context["request"].user, None).get(pk=value.pk)
            except OrgUnit.DoesNotExist:
                pass  # that way, if the condition is false, the exception is raised as well
        raise serializers.ValidationError("Org unit type not assigned to this form or not accessible to this user")

    def validate_period(self, value):
        """
        Check if period is of self.instance.form.period_type.
        """

        if periods.detect(value) == self.instance.form.period_type:
            return value
        raise serializers.ValidationError(
            f"Wrong period type, expecting: {self.instance.form.period_type}. Received type: {periods.detect(value)}"
        )


class OrgUnitNestedSerializer(OrgUnitSerializer):
    class Meta:
        model = OrgUnit
        fields = [
            "id",
            "name",
        ]
        ref_name = "OrgUnitNestedSerializerForInstances"


class InstanceFileAttachmentSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    instance_id = serializers.IntegerField()
    file = serializers.FileField(use_url=True)
    created_at = TimestampField(read_only=True)
    file_type = serializers.SerializerMethodField()
    name = serializers.CharField(read_only=True)
    submitted_at = TimestampField(source="instance.created_at", read_only=True)
    org_unit = OrgUnitNestedSerializer(source="instance.org_unit", read_only=True)
    question_name = serializers.CharField(source="question", read_only=True)
    question_id = serializers.CharField(source="key_name", read_only=True)
    form_name = serializers.CharField(source="instance.form.name", read_only=True)

    def get_file_type(self, obj):
        return get_file_type(obj.file)


# For readonly use
class InstanceLockSerializer(serializers.ModelSerializer):
    class Meta:
        model = InstanceLock
        fields = ["id", "top_org_unit", "locked_by", "locked_at", "unlocked_by", "locked_by"]
        read_only_fields = ["locked_at", "locked_by"]

    # TODO: can we use the generic UserSerializer to keeps things less interleaved?
    locked_by = UserSerializerForComment(read_only=True)
    unlocked_by = UserSerializerForComment(read_only=True)
    top_org_unit = OrgUnitNestedSerializer(read_only=True)


class UnlockSerializer(serializers.Serializer):
    lock = serializers.PrimaryKeyRelatedField(queryset=InstanceLock.objects.all())
    # we will  check that the user can access from the directly in remove_lock()
