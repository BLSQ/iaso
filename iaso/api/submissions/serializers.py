from rest_framework import serializers


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
    content = serializers.DictField(
        help_text="The answers, by question name, as `Instance.json`; `_version` picks the form version"
    )


class SubmissionsCreateSerializer(StrictSerializer):
    """The items are only checked to be objects here: each one is then validated on its own, so that the errors of
    every submission come back together, by `ref`."""

    submissions = serializers.ListField(child=serializers.DictField(), min_length=1, max_length=MAX_SUBMISSIONS)


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
    errors = SubmissionErrorSerializer(many=True, required=False)
    warnings = SubmissionErrorSerializer(many=True, required=False)


class SubmissionsResultSerializer(serializers.Serializer):
    results = SubmissionResultSerializer(many=True)
