from rest_framework import serializers

from iaso.api.common.serializer_fields import CommaSeparatedMultipleChoiceField, CommaSeparatedPrimaryKeysField
from iaso.api.promptness_stats.constants import PROMPTNESS_STATUSES
from iaso.models import Form, OrgUnit, OrgUnitType
from iaso.periods import Period, detect


class PromptnessStatsQueryParamsSerializer(serializers.Serializer):
    """Validates the query params shared by the `list` and `export_csv` actions.

    Expects the request in its context (`context={"request": request}`) to restrict the choices to what the user
    can access.

    Params -> validated data:
    - `form_id` (required) -> `form`: Form accessible to the user, with a `period_type` and a
      `promptness_grace_period_days`
    - `period` (required) -> `period`: iaso period string whose type matches `form.period_type`
    - `parent_org_unit_id` (required) -> `parent_org_unit`: OrgUnit accessible to the user
    - `org_unit_type_ids` (optional, comma-separated) -> `org_unit_types`: list of OrgUnitType accessible to the user
    - `status` (optional, comma-separated) -> `status`: set among `PROMPTNESS_STATUSES`, defaults to all

    `order` is handled by the view ordering settings, `page` and `limit` by the pagination class.
    """

    form_id = serializers.PrimaryKeyRelatedField(
        queryset=Form.objects.none(),
        source="form",
        help_text="Form for which the promptness is computed",
    )
    period = serializers.CharField(help_text="Period of the submissions, must match the form period type")
    parent_org_unit_id = serializers.PrimaryKeyRelatedField(
        queryset=OrgUnit.objects.none(),
        source="parent_org_unit",
        help_text="Totals are computed for this org unit, rows are its direct children by default",
    )
    org_unit_type_ids = CommaSeparatedPrimaryKeysField(
        child_relation=serializers.PrimaryKeyRelatedField(queryset=OrgUnitType.objects.none()),
        source="org_unit_types",
        required=False,
        help_text="Rows are the descendants of the parent org unit having these types (list separated by ',')",
    )
    status = CommaSeparatedMultipleChoiceField(
        choices=PROMPTNESS_STATUSES,
        default=lambda: set(PROMPTNESS_STATUSES),
        allow_empty=False,
        help_text="Statuses to include (list separated by ',')",
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        request = self.context.get("request")
        if request and request.user.is_authenticated:
            user = request.user
            self.fields["form_id"].queryset = Form.objects.filter_for_user_and_app_id(user).distinct()
            self.fields["parent_org_unit_id"].queryset = OrgUnit.objects.filter_for_user(user)
            self.fields["org_unit_type_ids"].child_relation.queryset = OrgUnitType.objects.filter_for_user_and_app_id(
                user, None
            ).distinct()

    def validate_form_id(self, form: Form) -> Form:
        if not form.period_type:
            raise serializers.ValidationError("The form has no period type")
        if form.promptness_grace_period_days is None:
            raise serializers.ValidationError("The form has no grace period")
        return form

    def validate_period(self, period: str) -> str:
        try:
            # `detect()` is lenient (e.g. "202613" is a MONTH): computing the start date rejects invalid values
            Period.from_string(period).start_date()
        except ValueError:
            raise serializers.ValidationError("Invalid period")
        return period

    def validate(self, attrs):
        period_type = detect(attrs["period"])
        form_period_type = attrs["form"].period_type
        if period_type != form_period_type:
            raise serializers.ValidationError(
                {"period": [f"Period type {period_type} does not match the form period type {form_period_type}"]}
            )
        return attrs


class PromptnessPeriodSerializer(serializers.Serializer):
    """Serializes a `PromptnessPeriod` into the `period` block of the response."""

    def to_representation(self, instance):
        raise NotImplementedError


class PromptnessStatsCountsSerializer(serializers.Serializer):
    """Base serializer for the counts of a row or of the totals.

    Input: an object (or dict) with `expected`, `on_time`, `late` and `missing`.
    Output: the counts plus `received`, `completeness_percent` and a `<status>_percent` for each status.

    - Percentages are computed against `expected`, rounded to 1 decimal, `None` when `expected` is 0.
    - Statuses missing from `context["status"]` have their count and percentage set to `None`
      (`expected`, `received` and `completeness_percent` are not affected).
    """

    def to_representation(self, instance):
        raise NotImplementedError


class PromptnessStatsTotalsSerializer(PromptnessStatsCountsSerializer):
    """Serializes the `totals` block of the response (computed for the parent org unit)."""


class PromptnessStatsRowSerializer(PromptnessStatsCountsSerializer):
    """Serializes one row of `results`.

    Input: an OrgUnit annotated with `expected`, `on_time`, `late`, `missing` and `has_children`.
    Output: `id`, `name`, `org_unit_type_id`, `parent_org_unit` (`{id, name}` or `None`), `has_children` and the counts.
    """
