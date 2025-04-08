from typing import Optional

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from hat.audit.audit_logger import AuditLogger
from hat.audit.models import ORG_UNIT_CHANGE_REQUEST_CONFIGURATION_API
from iaso.api.common import TimestampField
from iaso.api.org_unit_change_request_configurations.validation import (
    validate_forms,
    validate_group_sets,
    validate_groups,
    validate_org_unit_types,
)
from iaso.api.query_params import INCLUDE_CREATION, PROJECT_ID, TYPE
from iaso.models import Form, Group, GroupSet, OrgUnitChangeRequestConfiguration, OrgUnitType, Project
from iaso.utils.serializer.id_or_uuid_field import IdOrUuidRelatedField


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


class MobileOrgUnitChangeRequestConfigurationListSerializer(serializers.ModelSerializer):
    """
    Used to list many `OrgUnitChangeRequestConfiguration` instances for mobile.
    """

    org_unit_type_id = serializers.PrimaryKeyRelatedField(source="org_unit_type", queryset=OrgUnitType.objects.none())
    possible_type_ids = serializers.PrimaryKeyRelatedField(
        source="possible_types", queryset=OrgUnitType.objects.none(), many=True
    )
    possible_parent_type_ids = serializers.PrimaryKeyRelatedField(
        source="possible_parent_types", queryset=OrgUnitType.objects.none(), many=True
    )
    group_set_ids = serializers.PrimaryKeyRelatedField(source="group_sets", queryset=GroupSet.objects.none(), many=True)
    editable_reference_form_ids = serializers.PrimaryKeyRelatedField(
        source="editable_reference_forms", queryset=Form.objects.none(), many=True
    )
    other_group_ids = serializers.PrimaryKeyRelatedField(
        source="other_groups", queryset=Group.objects.none(), many=True
    )
    created_at = TimestampField()
    updated_at = TimestampField()

    class Meta:
        model = OrgUnitChangeRequestConfiguration
        fields = [
            "type",
            "org_unit_type_id",
            "org_units_editable",
            "editable_fields",
            "possible_type_ids",
            "possible_parent_type_ids",
            "group_set_ids",
            "editable_reference_form_ids",
            "other_group_ids",
            "created_at",
            "updated_at",
        ]


class OrgUnitChangeRequestConfigurationListSerializer(serializers.ModelSerializer):
    """
    Used to list many `OrgUnitChangeRequestConfiguration` instances.
    """

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
            "type",
            "project",
            "org_unit_type",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
            "editable_fields",
            "possible_types",
            "possible_parent_types",
            "group_sets",
            "editable_reference_forms",
            "other_groups",
        ]


class OrgUnitChangeRequestConfigurationRetrieveSerializer(serializers.ModelSerializer):
    """
    Used to fully fetch a single `OrgUnitChangeRequestConfiguration` instance.
    """

    project = ProjectNestedSerializer()
    org_unit_type = OrgUnitTypeNestedSerializer()
    org_units_editable = serializers.BooleanField()
    possible_types = OrgUnitTypeNestedSerializer(many=True)
    possible_parent_types = OrgUnitTypeNestedSerializer(many=True)
    group_sets = GroupSetNestedSerializer(many=True)
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
            "project",
            "type",
            "org_unit_type",
            "org_units_editable",
            "editable_fields",
            "possible_types",
            "possible_parent_types",
            "group_sets",
            "editable_reference_forms",
            "other_groups",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
        ]


class BaseOrgUnitChangeRequestConfigurationWriteUpdateSerializer(serializers.ModelSerializer):
    possible_type_ids = serializers.PrimaryKeyRelatedField(
        source="possible_types", queryset=OrgUnitType.objects.all(), many=True, allow_empty=True, required=False
    )
    possible_parent_type_ids = serializers.PrimaryKeyRelatedField(
        source="possible_parent_types", queryset=OrgUnitType.objects.all(), many=True, allow_empty=True, required=False
    )
    group_set_ids = serializers.PrimaryKeyRelatedField(
        source="group_sets", queryset=GroupSet.objects.all(), many=True, allow_empty=True, required=False
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
            "org_units_editable",
            "editable_fields",
            "possible_type_ids",
            "possible_parent_type_ids",
            "group_set_ids",
            "editable_reference_form_ids",
            "other_group_ids",
        ]

    @staticmethod
    def validate_editable_fields(value):
        fields_set = set()
        for field in value:
            if field not in OrgUnitChangeRequestConfiguration.LIST_OF_POSSIBLE_EDITABLE_FIELDS:
                raise serializers.ValidationError(f"Value '{field}' is not a valid choice.")
            fields_set.add(field)
        return list(fields_set)

    def validate_possible_type_ids(self, possible_types):
        user = self.context["request"].user
        validate_org_unit_types(user=user, org_unit_types=possible_types)
        return possible_types

    def validate_possible_parent_type_ids(self, possible_parent_types):
        user = self.context["request"].user
        validate_org_unit_types(user=user, org_unit_types=possible_parent_types)
        return possible_parent_types

    def validate_group_set_ids(self, group_sets):
        user = self.context["request"].user
        validate_group_sets(user=user, group_sets=group_sets)
        return group_sets

    def validate_editable_reference_form_ids(self, editable_reference_forms):
        user = self.context["request"].user
        validate_forms(user=user, forms=editable_reference_forms)
        return editable_reference_forms

    def validate_other_group_ids(self, other_groups):
        user = self.context["request"].user
        validate_groups(user=user, groups=other_groups)
        return other_groups


class OrgUnitChangeRequestConfigurationWriteSerializer(BaseOrgUnitChangeRequestConfigurationWriteUpdateSerializer):
    """
    Used to create one `OrgUnitChangeRequestConfiguration` instance.
    """

    id = serializers.IntegerField(read_only=True)
    project_id = IdOrUuidRelatedField(source="project", queryset=Project.objects.all())
    org_unit_type_id = serializers.PrimaryKeyRelatedField(source="org_unit_type", queryset=OrgUnitType.objects.all())

    class Meta(BaseOrgUnitChangeRequestConfigurationWriteUpdateSerializer.Meta):
        fields = [
            "id",
            "project_id",
            "type",
            "org_unit_type_id",
            *BaseOrgUnitChangeRequestConfigurationWriteUpdateSerializer.Meta.fields,
        ]

    def validate_org_unit_type_id(self, org_unit_type):
        user = self.context["request"].user
        validate_org_unit_types(user=user, org_unit_types=[org_unit_type])
        return org_unit_type

    def validate(self, validated_data):
        # All IDs should be validated here, but this will be done in another ticket
        request = self.context.get("request")
        user = request.user

        # Making sure that there is no soft-deleted OUCRC with the same project_id and org_unit_type_id
        project_id = validated_data["project"].id
        org_unit_type_id = validated_data["org_unit_type"].id
        oucrc_type = validated_data["type"]
        if OrgUnitChangeRequestConfiguration.objects.filter(
            project_id=project_id, org_unit_type_id=org_unit_type_id, type=oucrc_type
        ).exists():
            raise serializers.ValidationError(
                f"There is already a configuration for this project_id ({project_id}), org_unit_type_id ({org_unit_type_id}) and type ({oucrc_type}).)"
            )

        validated_data["created_by"] = user

        return validated_data

    def create(self, validated_data):
        # Overriding create in order to log the OUCRC creation
        # Splitting m2m relationships from the rest because you can't just do object.m2m_field = something
        data_without_m2m_relationships = validated_data
        m2m_relationships = pop_keys(
            data_without_m2m_relationships, OrgUnitChangeRequestConfiguration.LIST_OF_M2M_RELATIONSHIPS
        )
        new_oucrc = OrgUnitChangeRequestConfiguration.objects.create(**data_without_m2m_relationships)
        for key, value in m2m_relationships.items():
            getattr(new_oucrc, key).set(value)
        new_oucrc.save()

        audit_serializer = OrgUnitChangeRequestConfigurationAuditLogger()
        audit_serializer.log_modification(
            instance=new_oucrc,
            request_user=self.context["request"].user,
            old_data_dump=[],
        )
        return new_oucrc


class OrgUnitChangeRequestConfigurationUpdateSerializer(BaseOrgUnitChangeRequestConfigurationWriteUpdateSerializer):
    """
    Used to update a single `OrgUnitChangeRequestConfiguration` instance.
    """

    class Meta(BaseOrgUnitChangeRequestConfigurationWriteUpdateSerializer.Meta):
        pass  # there is no specific field for update that is not in the shared base

    def validate(self, validated_data):
        request = self.context.get("request")
        validated_data["updated_by"] = request.user
        return validated_data

    def update(self, instance, validated_data):
        # Overriding update in order to log the OUCRC creation
        audit_logger = OrgUnitChangeRequestConfigurationAuditLogger()
        old_data_dump = audit_logger.serialize_instance(instance)

        # Splitting m2m relationships from the rest because you can't just do object.m2m_field = something
        data_without_m2m_relationships = validated_data
        m2m_relationships = pop_keys(
            data_without_m2m_relationships, OrgUnitChangeRequestConfiguration.LIST_OF_M2M_RELATIONSHIPS
        )
        for attribute in data_without_m2m_relationships:
            setattr(instance, attribute, data_without_m2m_relationships[attribute])
        for key, value in m2m_relationships.items():
            getattr(instance, key).set(value)
        instance.save()

        audit_logger.log_modification(
            instance=instance,
            request_user=self.context["request"].user,
            old_data_dump=old_data_dump,
        )
        return instance


class AuditOrgUnitChangeRequestConfigurationSerializer(serializers.ModelSerializer):
    """
    This serializer reproduces the behavior of the default Django serializer used in the `log_modification` code.
    The `fields` field is important because it allows for comparing old/new versions of the object in the logs.
    The `model` field is not required and was added to reproduce the exact behavior of the Django serializer.
    """

    fields = serializers.SerializerMethodField(method_name="get_fields_for_audit")
    model = serializers.SerializerMethodField(method_name="get_model_for_audit")

    class Meta:
        model = OrgUnitChangeRequestConfiguration
        fields = ["pk", "model", "fields"]

    def get_fields_for_audit(self, instance):
        return NestedOrgUnitChangeRequestConfigurationSerializer(instance).data

    def get_model_for_audit(self, instance):
        content_type = ContentType.objects.get_for_model(instance)
        return f"{content_type.app_label}.{content_type.model}"


class NestedOrgUnitChangeRequestConfigurationSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrgUnitChangeRequestConfiguration
        fields = "__all__"


class OrgUnitChangeRequestConfigurationAuditLogger(AuditLogger):
    serializer = AuditOrgUnitChangeRequestConfigurationSerializer
    default_source = ORG_UNIT_CHANGE_REQUEST_CONFIGURATION_API


def pop_keys(dict, keys_to_pop):
    popped_keys = {}
    for key in keys_to_pop:
        if key in dict:
            popped_keys[key] = dict.pop(key)
    return popped_keys


class ProjectIdSerializer(serializers.Serializer):
    """
    Serializer for `project_id` when passed in query_params.

    Used to handle parsing and errors:

        serializer = ProjectIdSerializer(data=self.request.query_params)
        serializer.is_valid(raise_exception=True)
        project_id = serializer.data["project_id"]

        OR

        project_id = ProjectIdSerializer(data=self.request.query_params).get_project_id(raise_exception=True)
    """

    project_id = serializers.PrimaryKeyRelatedField(queryset=Project.objects.all(), allow_null=False)

    def get_project_id(self, raise_exception: bool):
        if not self.is_valid(raise_exception=raise_exception):
            return None
        return self.data[PROJECT_ID]


class OrgUnitChangeRequestConfigurationTypeSerializer(serializers.Serializer):
    """
    Serializer for `type` when passed in query_params.

    Used to handle parsing and errors:

        serializer = OrgUnitChangeRequestConfigurationTypeSerializer(data=self.request.query_params)
        serializer.is_valid(raise_exception=True)
        type = serializer.data["type"]

        OR

        oucrc_type = OrgUnitChangeRequestConfigurationTypeSerializer(data=self.request.query_params).get_type(raise_exception=True)
    """

    type = serializers.ChoiceField(choices=OrgUnitChangeRequestConfiguration.Type.choices, allow_null=False)

    def get_type(self, raise_exception: bool) -> Optional[OrgUnitChangeRequestConfiguration.Type]:
        if not self.is_valid(raise_exception=raise_exception):
            return None
        return self.validated_data[TYPE]


class IncludeCreationSerializer(serializers.Serializer):
    """
    Serializer for `include_creation` when passed in query_params.

    Used to handle parsing and errors:

        serializer = IncludeCreationSerializer(data=self.request.query_params)
        serializer.is_valid(raise_exception=True)
        include_creation = serializer.data["include_creation"]

        OR

        include_creation = IncludeCreationSerializer(data=self.request.query_params).get_include_creation(raise_exception=True)
    """

    include_creation = serializers.BooleanField(allow_null=True, default=False)

    def get_include_creation(self, raise_exception: bool) -> Optional[bool]:
        if not self.is_valid(raise_exception=raise_exception):
            return None
        return self.validated_data[INCLUDE_CREATION]
