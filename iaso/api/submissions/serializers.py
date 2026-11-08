from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from iaso.models import Instance


#: per request: odk_cli runs once per submission
MAX_SUBMISSIONS = 100


class StrictSerializer(serializers.Serializer):
    """Unknown fields are refused instead of ignored: a typo (`orgunit_id`) mustn't silently drop a value."""

    def to_internal_value(self, data):
        if isinstance(data, dict):
            unknown = sorted(set(data) - set(self.fields))
            if unknown:
                raise serializers.ValidationError({name: ["Unknown field."] for name in unknown})
        return super().to_internal_value(data)


class LocationSerializer(StrictSerializer):
    latitude = serializers.FloatField(min_value=-90, max_value=90)
    longitude = serializers.FloatField(min_value=-180, max_value=180)
    altitude = serializers.FloatField(required=False, allow_null=True)
    accuracy = serializers.DecimalField(max_digits=7, decimal_places=2, min_value=0, required=False, allow_null=True)


class SubmissionEntitySerializer(StrictSerializer):
    uuid = serializers.UUIDField(required=False, help_text="Generated when registering, required when following")
    entity_type_id = serializers.IntegerField()


class SubmissionCreateSerializer(StrictSerializer):
    """One submission: its envelope, checked here, and its flat content, checked against the form by odk_cli."""

    ref = serializers.CharField(required=False, max_length=255, help_text="Echoed in the results, e.g. a row number")
    uuid = serializers.UUIDField(required=False, help_text="Idempotency key; generated if absent")
    form_id = serializers.IntegerField()
    project_id = serializers.IntegerField(required=False, help_text="Required when the form is in several projects")
    org_unit_id = serializers.IntegerField()
    period = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    source_created_at = serializers.DateTimeField(required=False, allow_null=True)
    location = LocationSerializer(required=False, allow_null=True)
    entity = SubmissionEntitySerializer(
        required=False,
        allow_null=True,
        help_text="With the entity type's reference form, registers a new entity; with another form, follows one",
    )
    content = serializers.DictField(
        help_text="The answers, by question name, as `Instance.json`; `_version` picks the form version"
    )


class SubmissionsCreateSerializer(StrictSerializer):
    """The items are only checked to be objects here: each one is then validated on its own, so that the errors of
    every submission come back together, by `ref`."""

    submissions = serializers.ListField(child=serializers.DictField(), min_length=1, max_length=MAX_SUBMISSIONS)


class SubmissionsMultipartSerializer(serializers.Serializer):
    """With files: the JSON in `payload`, then one part per file, named as the binary answers name them."""

    payload = serializers.JSONField(help_text='The JSON body: {"submissions": [...]}')


class SubmissionErrorSerializer(serializers.Serializer):
    code = serializers.CharField()
    field = serializers.CharField(allow_null=True)
    message = serializers.CharField()
    question = serializers.CharField(required=False)
    answer = serializers.CharField(required=False)
    expected = serializers.CharField(required=False, allow_null=True)


class SubmissionResultSerializer(serializers.Serializer):
    ref = serializers.CharField()
    status = serializers.ChoiceField(choices=["created", "unchanged", "valid", "refused"])
    id = serializers.IntegerField(required=False)
    uuid = serializers.CharField(required=False)
    form_version = serializers.CharField(required=False)
    entity_uuid = serializers.CharField(required=False, help_text="The entity registered or followed")
    errors = SubmissionErrorSerializer(many=True, required=False)
    warnings = SubmissionErrorSerializer(many=True, required=False)


class SubmissionsResultSerializer(serializers.Serializer):
    results = SubmissionResultSerializer(many=True)
    import_id = serializers.IntegerField(help_text="The request, as kept for the audit (`APIImport`)")


class SubmissionLocationSerializer(serializers.Serializer):
    latitude = serializers.FloatField(source="location.y")
    longitude = serializers.FloatField(source="location.x")
    altitude = serializers.FloatField(source="location.z", allow_null=True)
    accuracy = serializers.DecimalField(max_digits=7, decimal_places=2, allow_null=True)


class SubmissionSerializer(serializers.ModelSerializer):
    """A submission in the shape `POST` and `PATCH` take: what is read can be sent back as is."""

    location = serializers.SerializerMethodField()
    content = serializers.JSONField(source="json")

    class Meta:
        model = Instance
        fields = [
            "id",
            "uuid",
            "form_id",
            "project_id",
            "org_unit_id",
            "period",
            "source_created_at",
            "location",
            "updated_at",
            "deleted",
            "content",
        ]
        read_only_fields = fields

    @extend_schema_field(SubmissionLocationSerializer(allow_null=True))
    def get_location(self, instance: Instance):
        if instance.location is None:
            return None
        return SubmissionLocationSerializer(instance).data


class SubmissionPatchSerializer(StrictSerializer):
    org_unit_id = serializers.IntegerField(required=False)
    period = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    content = serializers.DictField(
        required=False,
        help_text="JSON Merge Patch on the flat content: a name sent is set, null clears it, a name absent is "
        "untouched; a repeat's list gives its instances by position, {} leaves one as it is",
    )
    expected_updated_at = serializers.DateTimeField(
        required=False, help_text="`updated_at` as read: refused if the submission changed since"
    )

    def validate(self, attrs):
        if not {"org_unit_id", "period", "content"} & set(attrs):
            raise serializers.ValidationError("Nothing to change: org_unit_id, period or content")
        return attrs


class SubmissionPatchResultSerializer(serializers.Serializer):
    submission = SubmissionSerializer()
    warnings = SubmissionErrorSerializer(many=True)
    import_id = serializers.IntegerField(help_text="The request, as kept for the audit (`APIImport`)")


class SubmissionErrorsSerializer(serializers.Serializer):
    errors = SubmissionErrorSerializer(many=True)
    import_id = serializers.IntegerField(help_text="The request, as kept for the audit (`APIImport`)")
