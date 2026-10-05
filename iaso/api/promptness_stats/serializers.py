from rest_framework import serializers

from iaso.api.common.serializer_fields import CommaSeparatedMultipleChoiceField, CommaSeparatedPrimaryKeysField
from iaso.api.promptness_stats.constants import (
    PROMPTNESS_STATUSES,
    STATUS_LATE,
    STATUS_MISSING,
    STATUS_ON_TIME,
)
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
            self.fields["org_unit_type_ids"].child_relation.queryset = OrgUnitType.objects.filter(
                projects__account=user.iaso_profile.account
            ).distinct()

    def validate_form_id(self, form: Form) -> Form:
        if not form.period_type:
            raise serializers.ValidationError("The form has no period type")
        if form.promptness_grace_period_days is None:
            raise serializers.ValidationError("The form has no grace period")
        return form

    def validate_period(self, period: str) -> str:
        try:
            # building a Period objects validates its format, but not its value
            # to validate its value, you need to compute its start date
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

    value = serializers.CharField()
    start = serializers.DateField()
    end = serializers.DateField()
    grace_period_days = serializers.IntegerField()
    deadline = serializers.DateField()
    is_current = serializers.BooleanField()
    is_provisional = serializers.BooleanField()


class PromptnessStatsCountsSerializer(serializers.Serializer):
    """Base serializer for the counts of a row or of the totals.

    Input: an OrgUnit annotated by `annotate_counts()`: the counts (`expected`, `received`, `on_time`, `late`,
    `missing`) and the percentages (`completeness_percent`, `<status>_percent`) computed by the
    database.

    - An org unit with nothing expected in its hierarchy (itself included) is not applicable ("NA"):
      `is_applicable` is `False` and all the counts and percentages are `None`.
    - Statuses missing from `context["status"]` have their count and percentage set to `None`
      (`expected`, `received` and `completeness_percent` are not affected).

    The fields are declared for the API schema, the values are set in `to_representation()`.
    """

    STATUS_TO_FIELD = {STATUS_ON_TIME: "on_time", STATUS_LATE: "late", STATUS_MISSING: "missing"}
    COUNT_FIELDS = [
        "expected",
        "received",
        "completeness_percent",
        "on_time",
        "on_time_percent",
        "late",
        "late_percent",
        "missing",
        "missing_percent",
    ]

    is_applicable = serializers.BooleanField()
    expected = serializers.IntegerField(allow_null=True)
    received = serializers.IntegerField(allow_null=True)
    # `coerce_to_string=False`: rendered as numbers (`COERCE_DECIMAL_TO_STRING` is `True` by default)
    completeness_percent = serializers.DecimalField(
        max_digits=4, decimal_places=1, coerce_to_string=False, allow_null=True
    )
    on_time = serializers.IntegerField(allow_null=True)
    on_time_percent = serializers.DecimalField(max_digits=4, decimal_places=1, coerce_to_string=False, allow_null=True)
    late = serializers.IntegerField(allow_null=True)
    late_percent = serializers.DecimalField(max_digits=4, decimal_places=1, coerce_to_string=False, allow_null=True)
    missing = serializers.IntegerField(allow_null=True)
    missing_percent = serializers.DecimalField(max_digits=4, decimal_places=1, coerce_to_string=False, allow_null=True)

    def to_representation(self, org_unit: OrgUnit) -> dict:
        if org_unit.expected == 0:
            not_applicable_counts = {field_name: None for field_name in self.COUNT_FIELDS}
            return {"is_applicable": False, **not_applicable_counts}

        counts = {
            "is_applicable": True,
            "expected": org_unit.expected,
            "received": org_unit.received,
            "completeness_percent": org_unit.completeness_percent,
        }

        selected_statuses = self.context["status"]
        for status, field_name in self.STATUS_TO_FIELD.items():
            if status in selected_statuses:
                counts[field_name] = getattr(org_unit, field_name)
                counts[f"{field_name}_percent"] = getattr(org_unit, f"{field_name}_percent")
            else:
                counts[field_name] = None
                counts[f"{field_name}_percent"] = None

        return counts


class PromptnessStatsTotalsSerializer(PromptnessStatsCountsSerializer):
    """Serializes the `totals` block of the response (computed for the parent org unit)."""


class ParentOrgUnitSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()


class PromptnessStatsRowSerializer(PromptnessStatsCountsSerializer):
    """Serializes one row of `results`.

    Input: an OrgUnit annotated with `expected`, `on_time`, `late`, `missing` and `has_children`.
    Output: `id`, `name`, `org_unit_type_id`, `parent_org_unit` (`{id, name}` or `None`), `has_children` and the counts.
    """

    id = serializers.IntegerField()
    name = serializers.CharField()
    org_unit_type_id = serializers.IntegerField(allow_null=True)
    parent_org_unit = ParentOrgUnitSerializer(allow_null=True)
    has_children = serializers.BooleanField()

    def to_representation(self, org_unit: OrgUnit) -> dict:
        parent = org_unit.parent
        return {
            "id": org_unit.id,
            "name": org_unit.name,
            "org_unit_type_id": org_unit.org_unit_type_id,
            "parent_org_unit": {"id": parent.id, "name": parent.name} if parent else None,
            "has_children": org_unit.has_children,
            **super().to_representation(org_unit),
        }


class PromptnessStatsSummarySerializer(serializers.Serializer):
    """Serializes the response of the `summary` action.

    Input: a dict with `period` (a `PromptnessPeriod`) and `totals` (the parent org unit annotated by
    `annotate_counts()`). `context["status"]` is passed to the totals serializer.
    """

    period = PromptnessPeriodSerializer()
    totals = PromptnessStatsTotalsSerializer()
