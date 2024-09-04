import uuid

from rest_framework import serializers
from django.contrib.auth.models import User

from hat.audit.audit_logger import AuditLogger
from hat.audit.models import ORG_UNIT_CHANGE_REQUEST_CONFIGURATION_API
from iaso.models import (
    OrgUnitType,
    OrgUnitChangeRequestConfiguration,
    Project,
    GroupSet,
    Form,
    Group,
)
from iaso.utils.serializer.id_or_uuid_field import IdOrUuidRelatedField
from iaso.api.common import TimestampField


class UserNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name"]
        ref_name = "UserNestedSerializerForChangeRequestConfiguration"


class ProjectNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name"]
        ref_name = "ProjectNestedSerializerForChangeRequestConfiguration"


class OrgUnitTypeNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name"]
        ref_name = "OrgUnitTypeNestedSerializerForChangeRequestConfiguration"


class GroupNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name"]
        ref_name = "GroupNestedSerializerForChangeRequestConfiguration"


class GroupSetNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = GroupSet
        fields = ["id", "name"]
        ref_name = "GroupSetNestedSerializerForChangeRequestConfiguration"


class FormNestedSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ["id", "uuid", "form_id", "name"]
        ref_name = "GroupSetNestedSerializerForChangeRequestConfiguration"


# class MobileOrgUnitChangeRequestListSerializer(serializers.ModelSerializer):
#     """
#     Used to list many `OrgUnitChangeRequest` instances for mobile.
#     """
#
#     org_unit_id = serializers.IntegerField(source="org_unit.id")
#     org_unit_uuid = serializers.UUIDField(source="org_unit.uuid")
#     new_location = ThreeDimPointField()
#     created_at = TimestampField()
#     updated_at = TimestampField()
#     new_reference_instances = ReferenceInstancesSerializer(many=True)
#
#     class Meta:
#         model = OrgUnitChangeRequest
#         fields = [
#             "id",
#             "uuid",
#             "org_unit_id",
#             "org_unit_uuid",
#             "status",
#             "approved_fields",
#             "rejection_comment",
#             "created_at",
#             "updated_at",
#             "new_parent_id",
#             "new_name",
#             "new_org_unit_type_id",
#             "new_groups",
#             "new_location",
#             "new_location_accuracy",
#             "new_opening_date",
#             "new_closed_date",
#             "new_reference_instances",
#         ]


class OrgUnitChangeRequestConfigurationListSerializer(serializers.ModelSerializer):
    """
    Used to list many `OrgUnitChangeRequestConfiguration` instances.
    """

    uuid = serializers.UUIDField()
    project = ProjectNestedSerializer()
    org_unit_type = OrgUnitTypeNestedSerializer()
    created_by = UserNestedSerializer()
    updated_by = UserNestedSerializer()
    created_at = TimestampField()
    updated_at = TimestampField()

    class Meta:
        model = OrgUnitChangeRequestConfiguration
        fields = [
            "id",
            "uuid",
            "project",
            "org_unit_type",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
        ]


class OrgUnitChangeRequestConfigurationRetrieveSerializer(serializers.ModelSerializer):
    """
    Used to fully fetch a single `OrgUnitChangeRequestConfiguration` instance.
    """

    uuid = serializers.UUIDField()
    project = ProjectNestedSerializer()
    org_unit_type = OrgUnitTypeNestedSerializer()
    org_units_editable = serializers.BooleanField()
    possible_types = OrgUnitTypeNestedSerializer(many=True)
    possible_parent_types = OrgUnitTypeNestedSerializer(many=True)
    possible_group_sets = GroupSetNestedSerializer(many=True)
    editable_reference_forms = FormNestedSerializer(many=True)
    other_groups = GroupNestedSerializer(many=True)
    created_by = UserNestedSerializer()
    updated_by = UserNestedSerializer()
    created_at = TimestampField()
    updated_at = TimestampField()

    class Meta:
        model = OrgUnitChangeRequestConfiguration
        fields = [
            "id",
            "uuid",
            "project",
            "org_unit_type",
            "org_units_editable",
            "editable_fields",
            "possible_types",
            "possible_parent_types",
            "possible_group_sets",
            "editable_reference_forms",
            "other_groups",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
        ]


class OrgUnitChangeRequestConfigurationWriteSerializer(serializers.ModelSerializer):
    """
    Used to create one `OrgUnitChangeRequestConfiguration` instance.
    """

    id = serializers.IntegerField(read_only=True)
    uuid = serializers.UUIDField(required=False, default=uuid.uuid4)
    project_id = IdOrUuidRelatedField(source="project", queryset=Project.objects.all())
    org_unit_type_id = serializers.PrimaryKeyRelatedField(source="org_unit_type", queryset=OrgUnitType.objects.all())
    possible_type_ids = serializers.PrimaryKeyRelatedField(
        source="possible_types", queryset=OrgUnitType.objects.all(), many=True, allow_empty=True, required=False
    )
    possible_parent_type_ids = serializers.PrimaryKeyRelatedField(
        source="possible_parent_types", queryset=OrgUnitType.objects.all(), many=True, allow_empty=True, required=False
    )
    possible_group_set_ids = serializers.PrimaryKeyRelatedField(
        source="possible_group_sets", queryset=GroupSet.objects.all(), many=True, allow_empty=True, required=False
    )
    editable_reference_form_ids = serializers.PrimaryKeyRelatedField(
        source="editable_reference_forms", queryset=Form.objects.all(), many=True, allow_empty=True, required=False
    )
    other_group_ids = serializers.PrimaryKeyRelatedField(
        source="other_groups", queryset=Group.objects.all(), many=True, allow_empty=True, required=False
    )

    class Meta:
        model = OrgUnitChangeRequestConfiguration
        fields = [
            "id",
            "uuid",
            "project_id",
            "org_unit_type_id",
            "org_units_editable",
            "editable_fields",
            "possible_type_ids",
            "possible_parent_type_ids",
            "possible_group_set_ids",
            "editable_reference_form_ids",
            "other_group_ids",
        ]

    def validate(self, validated_data):
        # All IDs should be validated here, but this will be done in another ticket
        request = self.context.get("request")
        user = request.user

        # Making sure the editable_fields values are correct
        editable_fields_set = set()
        for field in validated_data["editable_fields"]:
            if field not in OrgUnitChangeRequestConfiguration.LIST_OF_POSSIBLE_EDITABLE_FIELDS:
                raise serializers.ValidationError(f"The field '{field}' is not a valid editable field.")
            editable_fields_set.add(field)
        validated_data["editable_fields"] = list(editable_fields_set)

        validated_data["created_by"] = user

        return validated_data


# class OrgUnitChangeRequestReviewSerializer(serializers.ModelSerializer):
#     """
#     Used to approve or reject one `OrgUnitChangeRequest`.
#     """
#
#     class Meta:
#         model = OrgUnitChangeRequest
#         fields = [
#             "status",
#             "approved_fields",
#             "rejection_comment",
#         ]
#
#     def validate_status(self, value):
#         approved = OrgUnitChangeRequest.Statuses.APPROVED
#         rejected = OrgUnitChangeRequest.Statuses.REJECTED
#         if value not in [approved, rejected]:
#             raise serializers.ValidationError(f"Must be `{approved}` or `{rejected}`.")
#         return value
#
#     def validate(self, validated_data):
#         instance = OrgUnitChangeRequest(**validated_data)
#         instance.clean()
#
#         status = validated_data.get("status")
#         approved_fields = validated_data.get("approved_fields")
#         rejection_comment = validated_data.get("rejection_comment")
#
#         if status == OrgUnitChangeRequest.Statuses.REJECTED and not rejection_comment:
#             raise serializers.ValidationError("A `rejection_comment` must be provided.")
#
#         if status == OrgUnitChangeRequest.Statuses.APPROVED and not approved_fields:
#             raise serializers.ValidationError("At least one `approved_fields` must be provided.")
#
#         return validated_data
#
#
# class AuditOrgUnitChangeRequestConfigurationSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = OrgUnitChangeRequestConfiguration
#         fields = "__all__"


# class OrgUnitChangeRequestAuditLogger(AuditLogger):
#     serializer = AuditOrgUnitChangeRequestConfigurationSerializer
#     default_source = ORG_UNIT_CHANGE_REQUEST_CONFIGURATION_API
