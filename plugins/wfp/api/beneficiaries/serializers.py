"""Serializers of the beneficiaries API: beneficiaries with their journeys, visits and steps, and their data."""

from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from rest_framework import serializers

from plugins.wfp.models import Journey, Step, Visit


class StepSerializer(serializers.ModelSerializer):
    class Meta:
        model = Step
        fields = ["id", "assistance_type", "quantity_given", "ration_size", "instance_id"]


class VisitSerializer(serializers.ModelSerializer):
    org_unit_name = serializers.CharField(source="org_unit.name", default=None)
    steps = StepSerializer(source="step_set", many=True)

    class Meta:
        model = Visit
        fields = [
            "id",
            "number",
            "date",
            "org_unit_id",
            "org_unit_name",
            "muac_size",
            "whz_color",
            "oedema",
            "entry_point",
            "instance_id",
            "steps",
        ]


class JourneySerializer(serializers.ModelSerializer):
    visits = VisitSerializer(source="visit_set", many=True)

    class Meta:
        model = Journey
        fields = [
            "id",
            "nutrition_programme",
            "programme_type",
            "physiology_status",
            "admission_type",
            "admission_criteria",
            "start_date",
            "end_date",
            "exit_type",
            "instance_id",
            "visits",
        ]


class BeneficiarySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    entity_id = serializers.IntegerField()
    progress_id = serializers.CharField(allow_null=True, default=None)
    uuid = serializers.UUIDField(source="entity.uuid")
    entity_type_id = serializers.IntegerField(source="entity.entity_type_id")
    entity_type_name = serializers.CharField(source="entity.entity_type.name")
    gender = serializers.CharField()
    birth_date = serializers.DateField()
    journeys_count = serializers.IntegerField()
    visits_count = serializers.IntegerField()
    last_visit_date = serializers.DateTimeField()
    journeys = JourneySerializer(many=True)


class RowsField(serializers.Field):
    """Flattened (path, value) rows of a submission, as `{"key": ..., "value": ...}` objects."""

    def to_representation(self, rows):
        return [{"key": key, "value": value} for key, value in rows]


class SubmissionSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    form_name = serializers.CharField(source="form.name", default=None)
    form_id = serializers.CharField(source="form.form_id", default=None)
    org_unit_name = serializers.CharField(source="org_unit.name", default=None)
    source_created_at = serializers.DateTimeField()
    created_at = serializers.DateTimeField()
    updated_at = serializers.DateTimeField()
    deleted = serializers.BooleanField()


class SubmissionWithFieldsSerializer(SubmissionSerializer):
    rows = RowsField()


class SubmissionFieldsSerializer(serializers.Serializer):
    submission = SubmissionSerializer()
    rows = RowsField()


class EntitySerializer(serializers.Serializer):
    id = serializers.IntegerField()
    uuid = serializers.UUIDField()
    entity_type_name = serializers.CharField(source="entity_type.name", default=None)
    created_at = serializers.DateTimeField()
    deleted_at = serializers.DateTimeField()
    reference_submission_id = serializers.IntegerField(source="attributes_id", default=None)


class EtlBeneficiarySerializer(serializers.Serializer):
    gender = serializers.CharField()
    birth_date = serializers.DateField()
    guidelines = serializers.CharField()


class BeneficiaryDetailsSerializer(serializers.Serializer):
    entity = EntitySerializer()
    beneficiary = EtlBeneficiarySerializer(allow_null=True)
    attributes = RowsField()
    submissions = SubmissionWithFieldsSerializer(many=True)


class VisitPeriodSerializer(serializers.Serializer):
    """The visit period filter of the beneficiaries page, of its list and of its exports.

    `visit_date_after` and `visit_date_before` (YYYY-MM-DD, both included, both optional), validated as `start_date`
    and `end_date`. Each error is reported on the field to correct, so that the page can show it next to it.
    """

    default_error_messages = {
        "end_before_start": _("The end date must be after the start date."),
    }

    visit_date_after = serializers.DateField(required=False, source="start_date")
    visit_date_before = serializers.DateField(required=False, source="end_date")

    def validate(self, attrs):
        start_date, end_date = attrs.get("start_date"), attrs.get("end_date")
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError(
                {"visit_date_before": self.error_messages["end_before_start"]}, code="end_before_start"
            )
        return attrs


class EligibleExportParamsSerializer(VisitPeriodSerializer):
    """The period of the eligible beneficiaries export, by default from the 26th of last month to the 25th (or today).

    Unlike the list (which shows the planned visits too), no date can be in the future.
    """

    # merged by DRF with the error messages of the parent
    default_error_messages = {
        "future_date": _("The date cannot be in the future."),
    }

    def _not_in_the_future(self, value):
        if value > timezone.localdate():
            raise serializers.ValidationError(self.error_messages["future_date"], code="future_date")
        return value

    def validate_visit_date_after(self, value):
        return self._not_in_the_future(value)

    def validate_visit_date_before(self, value):
        return self._not_in_the_future(value)
