import uuid

from rest_framework import serializers

from iaso.models import Instance, OrgUnit, OrgUnitChangeRequest, OrgUnitType
from iaso.utils.serializer.three_dim_point_field import ThreeDimPointField


class InstanceForChangeRequest(serializers.ModelSerializer):
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


class OrgUnitForChangeRequest(serializers.ModelSerializer):
    """
    Used for nesting `OrgUnit` instances.
    """

    parent = serializers.CharField(source="parent.name", default="")
    org_unit_type_name = serializers.CharField(source="org_unit_type.name")
    groups = serializers.SerializerMethodField(method_name="get_groups")
    location = ThreeDimPointField()
    reference_instances = InstanceForChangeRequest(many=True)

    class Meta:
        model = OrgUnit
        fields = [
            "id",
            "parent",
            "name",
            "org_unit_type_id",
            "org_unit_type_name",
            "groups",
            "location",
            "reference_instances",
        ]

    def get_groups(self, obj: OrgUnitChangeRequest):
        return [group.name for group in obj.groups.all()]


class MobileOrgUnitChangeRequestListSerializer(serializers.ModelSerializer):
    """
    Used to list many `OrgUnitChangeRequest` instances for mobile.
    """

    org_unit_id = serializers.IntegerField(source="org_unit.id")
    org_unit_uuid = serializers.UUIDField(source="org_unit.uuid")
    new_location = ThreeDimPointField()

    class Meta:
        model = OrgUnitChangeRequest
        fields = [
            "id",
            "uuid",
            "org_unit_id",
            "org_unit_uuid",
            "status",
            "approved_fields",
            "rejection_comment",
            "created_at",
            "updated_at",
            "new_parent_id",
            "new_name",
            "new_org_unit_type_id",
            "new_groups",
            "new_location",
            "new_location_accuracy",
            "new_reference_instances",
        ]


class OrgUnitChangeRequestListSerializer(serializers.ModelSerializer):
    """
    Used to list many `OrgUnitChangeRequest` instances.
    """

    org_unit_id = serializers.IntegerField(source="org_unit.id")
    org_unit_uuid = serializers.UUIDField(source="org_unit.uuid")
    org_unit_name = serializers.CharField(source="org_unit.name")
    org_unit_type_id = serializers.IntegerField(source="org_unit.org_unit_type.id")
    org_unit_type_name = serializers.CharField(source="org_unit.org_unit_type.name")
    groups = serializers.SerializerMethodField(method_name="get_current_org_unit_groups")
    created_by = serializers.CharField(source="created_by.username", default="")
    updated_by = serializers.CharField(source="updated_by.username", default="")

    class Meta:
        model = OrgUnitChangeRequest
        fields = [
            "id",
            "uuid",
            "org_unit_id",
            "org_unit_uuid",
            "org_unit_name",
            "org_unit_type_id",
            "org_unit_type_name",
            "status",
            "groups",
            "requested_fields",
            "approved_fields",
            "rejection_comment",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
        ]

    def get_current_org_unit_groups(self, obj: OrgUnitChangeRequest):
        return [group.name for group in obj.org_unit.groups.all()]


class OrgUnitChangeRequestRetrieveSerializer(serializers.ModelSerializer):
    """
    Used to show one `OrgUnitChangeRequest` instance.
    """

    org_unit = OrgUnitForChangeRequest()
    created_by = serializers.CharField(source="created_by.username", default="")
    updated_by = serializers.CharField(source="updated_by.username", default="")
    new_parent = serializers.CharField(source="new_parent.name", default="")
    new_org_unit_type_name = serializers.CharField(source="new_org_unit_type.name", default="")
    new_groups = serializers.SerializerMethodField(method_name="get_new_groups")
    new_location = ThreeDimPointField()
    new_reference_instances = InstanceForChangeRequest(many=True)

    class Meta:
        model = OrgUnitChangeRequest
        fields = [
            "id",
            "uuid",
            "status",
            "created_by",
            "created_at",
            "updated_by",
            "updated_at",
            "requested_fields",
            "approved_fields",
            "rejection_comment",
            "org_unit",
            "new_parent",
            "new_name",
            "new_org_unit_type_id",
            "new_org_unit_type_name",
            "new_groups",
            "new_location",
            "new_location_accuracy",
            "new_reference_instances",
        ]

    def get_new_groups(self, obj: OrgUnitChangeRequest):
        return [group.name for group in obj.new_groups.all()]


class OrgUnitChangeRequestWriteSerializer(serializers.ModelSerializer):
    """
    Used to create or update one `OrgUnitChangeRequest` instance.
    """

    uuid = serializers.UUIDField(required=False, default=uuid.uuid4)
    org_unit_id = serializers.PrimaryKeyRelatedField(
        source="org_unit",
        queryset=OrgUnit.objects.all(),
        required=False,
    )
    new_parent_id = serializers.PrimaryKeyRelatedField(
        source="new_parent",
        queryset=OrgUnit.objects.all(),
        required=False,
    )
    new_org_unit_type_id = serializers.PrimaryKeyRelatedField(
        source="new_org_unit_type",
        queryset=OrgUnitType.objects.all(),
        required=False,
    )
    new_location = ThreeDimPointField(required=False)

    class Meta:
        model = OrgUnitChangeRequest
        fields = [
            "uuid",
            "updated_at",
            "org_unit_id",
            "new_parent_id",
            "new_name",
            "new_org_unit_type_id",
            "new_groups",
            "new_location",
            "new_location_accuracy",
            "new_reference_instances",
        ]
        extra_kwargs = {"created_by": {"default": serializers.CurrentUserDefault()}}

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        new_fields = [
            "new_parent_id",
            "new_name",
            "new_org_unit_type_id",
            "new_groups",
            "new_location",
            "new_reference_instances",
        ]
        if not any([validated_data.get(field) for field in new_fields]):
            raise serializers.ValidationError(
                f"You must provide at least one of the following fields: {', '.join(new_fields)}."
            )
        return validated_data
