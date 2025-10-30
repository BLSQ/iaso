from django.db import models
from django.db.models import Q
from rest_framework import serializers

from hat.api.export_utils import timestamp_to_utc_datetime
from iaso.api.common import TimestampField
from iaso.api.query_params import APP_ID
from iaso.models import Group, OrgUnit, OrgUnitType
from iaso.utils.serializer.three_dim_point_field import ThreeDimPointField


class TimestampSerializerMixin:
    """This Mixin override the serialization of the DateTime field to timestamp
    instead of RST default RFC3339

    this is used to stay compatible with older API"""

    serializer_field_mapping = serializers.ModelSerializer.serializer_field_mapping.copy()
    serializer_field_mapping[models.DateTimeField] = TimestampField  # type: ignore


class AppIdSerializer(serializers.Serializer):
    """
    Serializer for `Project.app_id` when passed in query_params.

    Used to handle parsing and errors:

        serializer = AppIdSerializer(data=self.request.query_params)
        serializer.is_valid(raise_exception=True)
        app_id = serializer.validated_data["app_id"]
    """

    app_id = serializers.CharField(allow_blank=False)

    def get_app_id(self, raise_exception: bool):
        if not self.is_valid(raise_exception=raise_exception):
            return None
        return self.data[APP_ID]


class GroupSerializer(TimestampSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ["id", "name", "source_ref", "source_version", "created_at", "updated_at"]


class OrgUnitTypeSerializer(TimestampSerializerMixin, serializers.ModelSerializer):
    class Meta:
        model = OrgUnitType
        fields = ["id", "name", "short_name", "created_at", "updated_at", "depth"]


# noinspection PyMethodMayBeStatic
class OrgUnitSerializer(TimestampSerializerMixin, serializers.ModelSerializer):
    """Master Serializer for OrgUnit

    This allows us to keep the conversion in one place, subclass if you want to serialize
    less or more field. See OrgUnitSearchParentSerializer for an example
    """

    org_unit_type = OrgUnitTypeSerializer()
    groups = GroupSerializer(many=True)
    parent_name = serializers.SerializerMethodField()  # type: ignore # see https://github.com/typeddjango/djangorestframework-stubs/issues/4
    source = serializers.SerializerMethodField()  # type: ignore # see https://github.com/typeddjango/djangorestframework-stubs/issues/4
    org_unit_type_name = serializers.SerializerMethodField()  # type: ignore # see https://github.com/typeddjango/djangorestframework-stubs/issues/4
    search_index = serializers.SerializerMethodField()
    source_id = serializers.SerializerMethodField()
    has_geo_json = serializers.SerializerMethodField()
    latitude = serializers.SerializerMethodField()
    longitude = serializers.SerializerMethodField()
    altitude = serializers.SerializerMethodField()
    projects = serializers.SerializerMethodField()

    # If in a subclass this will correctly use the subclass own serializer
    parent = serializers.SerializerMethodField()  # type: ignore # see https://github.com/typeddjango/djangorestframework-stubs/issues/4

    @classmethod
    def get_parent(cls, org_unit):
        return cls(org_unit.parent).data if org_unit.parent else None

    def get_parent_name(self, org_unit):
        return org_unit.parent.name if org_unit.parent else None

    def get_source(self, org_unit):
        return org_unit.version.data_source.name if org_unit.version else None

    def get_org_unit_type_name(self, org_unit):
        return org_unit.org_unit_type.name if org_unit.org_unit_type else None

    def get_search_index(self, org_unit):
        return getattr(org_unit, "search_index", None)

    def get_source_id(self, org_unit):
        return org_unit.version.data_source.id if org_unit.version else None

    def get_has_geo_json(self, org_unit):
        return True if org_unit.simplified_geom else False

    def get_latitude(self, org_unit):
        return org_unit.location.y if org_unit.location else None

    def get_longitude(self, org_unit):
        return org_unit.location.x if org_unit.location else None

    def get_altitude(self, org_unit):
        return org_unit.location.z if org_unit.location else None

    def get_creator(self, org_unit):
        if not org_unit.creator:
            return None

        username = org_unit.creator.username
        first_name = org_unit.creator.first_name
        last_name = org_unit.creator.last_name
        if first_name and last_name:
            return f"{username} ({first_name} {last_name})"
        if first_name:
            return f"{username} ({first_name})"
        if last_name:
            return f"{username} ({last_name})"
        return username

    def get_projects(self, org_unit):
        return [project.as_dict() for project in org_unit.org_unit_type.projects.all()]

    class Meta:
        model = OrgUnit

        fields = [
            "id",
            "name",
            "aliases",
            "parent_id",
            "validation_status",
            "parent_name",
            "source",
            "source_ref",
            "sub_source",
            "org_unit_type_name",
            "parent",
            "latitude",
            "longitude",
            "altitude",
            "has_geo_json",
            "search_index",
            "created_at",
            "org_unit_type_id",
            "creator",
        ]


class OrgUnitSmallSearchSerializer(OrgUnitSerializer):
    class Meta:
        model = OrgUnit

        fields = [
            "id",
            "name",
            "parent_id",
            "validation_status",
            "parent_name",
            "source",
            "source_ref",
            "org_unit_type_name",
            "search_index",
            "parent",
            "creator",
        ]


class OrgUnitSearchParentSerializer(OrgUnitSerializer):
    class Meta:
        model = OrgUnit
        fields = [
            "id",
            "name",
            "parent",
            "org_unit_type_id",
            "org_unit_type_name",
        ]


class OrgUnitDropdownSerializer(OrgUnitSerializer):
    class Meta:
        model = OrgUnit
        fields = ["value", "label"]

    label = serializers.CharField(source="name", read_only=True)  # type: ignore
    value = serializers.IntegerField(source="id", read_only=True)


# noinspection PyMethodMayBeStatic
class OrgUnitSearchSerializer(OrgUnitSerializer):
    parent = OrgUnitSearchParentSerializer()
    instances_count = serializers.SerializerMethodField()
    creator = serializers.SerializerMethodField()

    def get_instances_count(self, org_unit):
        # in some case instances_count is prefilled by an annotation
        if hasattr(org_unit, "instances_count"):
            return org_unit.instances_count
        return org_unit.instance_set.filter(~Q(file="") & ~Q(device__test_device=True) & ~Q(deleted=True)).count()

    class Meta:
        model = OrgUnit

        fields = [
            "id",
            "name",
            "aliases",
            "parent_id",
            "validation_status",
            "parent_name",
            "source",
            "source_ref",
            "sub_source",
            "org_unit_type_name",
            "parent",
            "latitude",
            "longitude",
            "altitude",
            "has_geo_json",
            "search_index",
            "created_at",
            "source_id",
            "org_unit_type",
            "org_unit_type_id",
            "instances_count",
            "updated_at",
            "groups",
            "creator",
            "projects",
            "default_image",
        ]


# noinspection PyMethodMayBeStatic
class OrgUnitTreeSearchSerializer(TimestampSerializerMixin, serializers.ModelSerializer):
    has_children = serializers.SerializerMethodField()
    org_unit_type_short_name = serializers.SerializerMethodField()  # new field

    @classmethod
    def get_has_children(cls, org_unit):
        return org_unit.children_count > 0

    def get_org_unit_type_short_name(self, org_unit):
        return org_unit.org_unit_type.short_name if org_unit.org_unit_type else None  # new method

    class Meta:
        model = OrgUnit
        fields = ["id", "name", "validation_status", "has_children", "org_unit_type_id", "org_unit_type_short_name"]


class OrgUnitImportSerializer(serializers.ModelSerializer):
    """Helper class for the validation and creation of OrgUnit instances from API data."""

    # Map the api's incoming 'id' field to the model's 'uuid' field.
    id = serializers.CharField(source="uuid")

    name = serializers.CharField(required=False, allow_null=True)
    accuracy = serializers.FloatField(required=False, allow_null=True)
    location = ThreeDimPointField(required=False, allow_null=True, write_only=True)

    # internal non-model fields
    created_at = serializers.FloatField(required=False, allow_null=True, write_only=True)
    parent_lookup = serializers.CharField(required=False, allow_null=True, write_only=True)
    org_unit_type_id_lookup = serializers.CharField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = OrgUnit
        fields = [
            "id",
            "name",
            "accuracy",
            "location",
            "created_at",
            "parent_lookup",
            "org_unit_type_id_lookup",
            "parent_id",
            "org_unit_type_id",
        ]
        extra_kwargs = {
            "created_at": {"write_only": True},
            "parent_lookup": {"write_only": True},
            "org_unit_type_id_lookup": {"write_only": True},
            "parent_id": {"required": False},
            "org_unit_type_id": {"required": False},
        }

    def to_internal_value(self, data):
        """Pre-process the incoming dictionary and handle legacy data formats."""
        processed_data = {}

        latitude = data.get("latitude")
        longitude = data.get("longitude")
        if latitude is None or longitude is None or (not latitude and not longitude):
            # treat 0, 0 as no location
            processed_data["location"] = None
        else:
            processed_data["location"] = {
                "latitude": latitude,
                "longitude": longitude,
                "altitude": data.get("altitude", 0.0),
            }

        # there exist versions of the mobile app in the wild with both parentId and parent_id
        parent_key = data.get("parentId") or data.get("parent_id")
        if parent_key:
            processed_data["parent_lookup"] = parent_key

        # there exist versions of the mobile app in the wild with both orgUnitTypeId and org_unit_type_id
        type_key = data.get("orgUnitTypeId") or data.get("org_unit_type_id")
        if type_key:
            processed_data["org_unit_type_id_lookup"] = type_key

        processed_data["id"] = data.get("id")
        processed_data["name"] = data.get("name")
        processed_data["accuracy"] = data.get("accuracy")
        processed_data["created_at"] = data.get("created_at")

        return super().to_internal_value(processed_data)

    def validate(self, data):
        # Resolve parent passed as id or uuid
        parent_lookup = data.pop("parent_lookup", None)
        if parent_lookup is not None:
            if str.isdigit(parent_lookup):
                data["parent_id"] = int(parent_lookup)
            else:
                try:
                    parent_org_unit = OrgUnit.objects.get(uuid=parent_lookup)
                    data["parent_id"] = parent_org_unit.id
                except OrgUnit.DoesNotExist:
                    raise serializers.ValidationError(
                        {"parent_id": f"Parent OrgUnit with uuid {parent_lookup} not found."}
                    )

        org_unit_type_id = data.pop("org_unit_type_id_lookup", None)
        if org_unit_type_id is not None:
            data["org_unit_type_id"] = org_unit_type_id

        return data

    def create(self, validated_data):
        """Implement get_or_create logic and set model fields not provided by the client."""
        uuid = validated_data.pop("uuid")
        org_unit, created = OrgUnit.objects.get_or_create(uuid=uuid)

        if not created:
            return None  # only handle new org units

        created_at = validated_data.pop("created_at", None)

        for attr, value in validated_data.items():
            setattr(org_unit, attr, value)

        set_source_created_at = self.context.get("set_source_created_at", True)
        if created_at and set_source_created_at:
            org_unit.source_created_at = timestamp_to_utc_datetime(int(created_at))

        org_unit.save()
        return org_unit
