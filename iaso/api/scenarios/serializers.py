import json

from collections import Counter
from typing import Any, Dict, List, Optional, Set, Union

from django.conf import settings
from drf_spectacular.utils import extend_schema_field
from pydantic import ValidationError as PydanticValidationError
from rest_framework import serializers

from iaso.api.common import ModelSerializer
from iaso.models import Account, EntityType, Scenario, ScenarioKind, WorkflowVersion
from iaso.scenarios.forms import account_forms
from iaso.scenarios.schema import EntityScenario, FormScenario, load_scenario


# scenarios


class ScenarioListSerializer(ModelSerializer):
    steps_count = serializers.SerializerMethodField()
    forms = serializers.SerializerMethodField()
    journey = serializers.SerializerMethodField()
    last_run_failed_step = serializers.SerializerMethodField()
    last_run_failures = serializers.SerializerMethodField()

    class Meta:
        model = Scenario
        fields = [
            "id",
            "name",
            "description",
            "kind",
            "entity_type_id",
            "steps_count",
            "forms",
            "journey",
            "last_run_at",
            "last_run_status",
            "last_run_workflow_version_id",
            "last_run_failed_step",
            "last_run_failures",
            "created_at",
            "updated_at",
        ]

    @extend_schema_field(serializers.IntegerField())
    def get_steps_count(self, scenario: Scenario) -> int:
        return len(scenario.definition.get("steps", []))

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_forms(self, scenario: Scenario) -> List[str]:
        """The forms filled, step by step (form_id)."""
        if scenario.kind == ScenarioKind.FORM:
            return [scenario.definition.get("form", "")]
        return [step.get("form", "") for step in scenario.definition.get("steps", [])]

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_journey(self, scenario: Scenario) -> List[str]:
        """The forms filled, step by step, by name (form_id when the form isn't found)."""
        form_names = self.context.get("form_names", {})
        return [form_names.get(form_id, form_id) for form_id in self.get_forms(scenario)]

    @extend_schema_field(serializers.IntegerField(allow_null=True))
    def get_last_run_failed_step(self, scenario: Scenario) -> Optional[int]:
        return (scenario.last_run_result or {}).get("failed_step")

    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_last_run_failures(self, scenario: Scenario) -> List[str]:
        return (scenario.last_run_result or {}).get("failures", [])


class ScenarioDetailSerializer(ScenarioListSerializer):
    entity_type_name = serializers.CharField(source="entity_type.name", allow_null=True, default=None)
    reference_form_id = serializers.IntegerField(source="entity_type.reference_form_id", allow_null=True, default=None)

    class Meta(ScenarioListSerializer.Meta):
        fields = ScenarioListSerializer.Meta.fields + [
            "entity_type_name",
            "reference_form_id",
            "definition",
            "last_run_result",
        ]


def _form_ids(definition) -> Set[str]:
    if isinstance(definition, EntityScenario):
        return {step.form for step in definition.steps}
    return {definition.form}


def load_definition(definition: Any) -> Union[EntityScenario, FormScenario]:
    """The scenario file, or a ValidationError listing `location: message` per error."""
    try:
        return load_scenario(json.dumps(definition))
    except PydanticValidationError as e:
        raise serializers.ValidationError(
            [f"{'.'.join(str(part) for part in error['loc'])}: {error['msg']}" for error in e.errors()]
        )


def registered_entity_type(account: Account, form_id: Optional[str]) -> EntityType:
    """The entity type the first step registers, filling `form_id`: the one whose reference form it is."""
    entity_types = list(EntityType.objects.filter(account=account, reference_form__form_id=form_id).order_by("id")[:2])
    if len(entity_types) != 1:
        reason = (
            "isn't the reference form of an entity type"
            if not entity_types
            else "is the reference form of several entity types"
        )
        raise serializers.ValidationError(
            {"definition": [f"The first step registers the entity: '{form_id}' {reason} of this account"]}
        )
    return entity_types[0]


class ScenarioWriteSerializer(ModelSerializer):
    """Imports a scenario file (`definition`, as in the file) into the user's account, or replaces a scenario's file
    (the scenario editor); the name and description come from the file."""

    definition = serializers.JSONField()

    class Meta:
        model = Scenario
        fields = ["id", "definition"]

    def validate_definition(self, definition: Any) -> Any:
        self.scenario_file = load_definition(definition)
        return definition

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        account, scenario_file = self.context["request"].user.iaso_profile.account, self.scenario_file
        max_length = Scenario._meta.get_field("name").max_length
        if len(scenario_file.name) > max_length:
            raise serializers.ValidationError({"definition": [f"name: at most {max_length} characters"]})
        same_name = Scenario.objects.filter(account=account, name=scenario_file.name)
        if self.instance is not None:
            same_name = same_name.exclude(id=self.instance.id)
        if same_name.exists():
            raise serializers.ValidationError(
                {"definition": [f"A scenario '{scenario_file.name}' already exists in this account"]}
            )
        form_ids = _form_ids(scenario_file)
        found = Counter(account_forms(account).filter(form_id__in=form_ids).values_list("form_id", flat=True))
        unknown = sorted(form_ids - set(found))
        if unknown:
            raise serializers.ValidationError({"definition": [f"Unknown forms in this account: {', '.join(unknown)}"]})
        ambiguous = sorted(form_id for form_id, count in found.items() if count > 1)
        if ambiguous:
            raise serializers.ValidationError(
                {"definition": [f"Several forms of the account have the form_id: {', '.join(ambiguous)}"]}
            )

        attrs.update(
            account=account,
            kind=scenario_file.kind,
            name=scenario_file.name,
            description=scenario_file.description,
            entity_type=None,
        )
        if isinstance(scenario_file, EntityScenario):
            first_form = scenario_file.steps[0].form if scenario_file.steps else None
            attrs["entity_type"] = registered_entity_type(account, first_form)
        return attrs

    def create(self, validated_data: Dict[str, Any]) -> Scenario:
        user = self.context["request"].user
        return Scenario.objects.create(**validated_data, created_by=user, updated_by=user)

    def update(self, scenario: Scenario, validated_data: Dict[str, Any]) -> Scenario:
        for name, value in validated_data.items():
            setattr(scenario, name, value)
        scenario.updated_by = self.context["request"].user
        # the last result was for the previous file
        scenario.last_run_at, scenario.last_run_status = None, ""
        scenario.last_run_workflow_version, scenario.last_run_result = None, None
        scenario.save()
        return scenario


# the scenario editor


class ScenarioPreviewRequestSerializer(serializers.Serializer):
    """A scenario file being written, run as it is, nothing saved: what the app would do with the steps so far."""

    definition = serializers.JSONField()
    workflow_version_id = serializers.PrimaryKeyRelatedField(
        source="workflow_version", queryset=WorkflowVersion.objects.none(), required=False, allow_null=True
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")  # none when the OpenAPI schema is generated
        if request:
            self.account = request.user.iaso_profile.account
            self.fields["workflow_version_id"].queryset = WorkflowVersion.objects.filter(
                workflow__entity_type__account=self.account
            ).select_related("workflow")

    def validate_definition(self, definition: Any) -> Any:
        self.scenario_file = load_definition(definition)
        steps = len(self.scenario_file.steps)
        if steps > settings.SCENARIOS_SYNC_MAX_STEPS:
            raise serializers.ValidationError(f"{steps} steps, at most {settings.SCENARIOS_SYNC_MAX_STEPS}")
        return definition

    def first_form(self, attrs: Dict[str, Any]) -> Optional[str]:
        """The form the first step fills: it says which entity type the scenario registers."""
        steps = self.scenario_file.steps
        return steps[0].form if steps else None

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        scenario_file = self.scenario_file
        entity_type = None
        if isinstance(scenario_file, EntityScenario):
            entity_type = registered_entity_type(self.account, self.first_form(attrs))
            version = attrs.get("workflow_version")
            if version is not None and version.workflow.entity_type_id != entity_type.id:
                raise serializers.ValidationError(
                    {"workflow_version_id": [f"Not a workflow version of '{entity_type.name}'"]}
                )
        # not saved: the scenario the run needs
        attrs["scenario"] = Scenario(
            account=self.account,
            kind=scenario_file.kind,
            entity_type=entity_type,
            name=scenario_file.name,
            definition=attrs["definition"],
        )
        return attrs


class ScenarioStepPrepareSerializer(ScenarioPreviewRequestSerializer):
    """The next step of a scenario being written (`definition`: the steps before it): the form to fill in web-forms,
    prefilled as the phone would prefill it."""

    form = serializers.CharField(
        required=False, allow_null=True, help_text="The step's form, by form_id; none: the first form the app offers"
    )
    answers = serializers.DictField(
        child=serializers.CharField(allow_blank=True), required=False, help_text="When editing the step: its answers"
    )
    context = serializers.DictField(child=serializers.CharField(), required=False)
    search = serializers.DictField(
        child=serializers.CharField(allow_blank=True),
        required=False,
        help_text="Registering: the search before the form, question -> value typed or scanned",
    )
    at = serializers.DateTimeField(
        required=False, allow_null=True, help_text="The step's clock: the forms offered on that day; none: now"
    )

    def first_form(self, attrs: Dict[str, Any]) -> Optional[str]:
        # no step yet: this one registers the entity
        return super().first_form(attrs) or attrs.get("form")


class ScenarioFormsQuerySerializer(serializers.Serializer):
    entity_type_id = serializers.PrimaryKeyRelatedField(source="entity_type", queryset=EntityType.objects.none())

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")  # none when the OpenAPI schema is generated
        if request:
            self.fields["entity_type_id"].queryset = EntityType.objects.filter(
                account=request.user.iaso_profile.account
            )


class ChoiceSerializer(serializers.Serializer):
    name = serializers.CharField()
    label = serializers.CharField()


class EditorQuestionSerializer(serializers.Serializer):
    name = serializers.CharField()
    label = serializers.CharField()
    type = serializers.ChoiceField(
        choices=["text", "integer", "decimal", "date", "datetime", "time", "select_one", "select_multiple"]
    )
    required = serializers.BooleanField()
    relevant = serializers.CharField(allow_blank=True, help_text="When it is asked (XPath); empty: always")
    choices = ChoiceSerializer(many=True)


class EditorFormSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    form_id = serializers.CharField()
    name = serializers.CharField()
    is_reference = serializers.BooleanField(help_text="The entity type's reference form: the first step fills it")
    questions = EditorQuestionSerializer(many=True)
    labels = serializers.DictField(
        child=serializers.CharField(), help_text="Question name -> label, of all the questions (calculates too)"
    )


class EditorFormsSerializer(serializers.Serializer):
    results = EditorFormSerializer(many=True)


# runs


class ScenarioRunRequestSerializer(serializers.Serializer):
    scenario_ids = serializers.ListField(child=serializers.IntegerField(), allow_empty=False)
    workflow_version_id = serializers.PrimaryKeyRelatedField(
        source="workflow_version",
        queryset=WorkflowVersion.objects.none(),
        required=False,
        allow_null=True,
        help_text="Run the entity scenarios against this version (a draft...) instead of their entity type's published "
        "one.",
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get("request")  # none when the OpenAPI schema is generated
        if request:
            self.account = request.user.iaso_profile.account
            self.fields["workflow_version_id"].queryset = WorkflowVersion.objects.filter(
                workflow__entity_type__account=self.account
            ).select_related("workflow")

    def validate_scenario_ids(self, scenario_ids: List[int]) -> List[Scenario]:
        """The scenarios, in the order given; an id of another account (or deleted) is refused, not ignored."""
        scenario_ids = list(dict.fromkeys(scenario_ids))
        scenarios = Scenario.objects.filter(account=self.account, id__in=scenario_ids).select_related(
            "account", "entity_type"
        )
        by_id = {scenario.id: scenario for scenario in scenarios}
        unknown = [str(scenario_id) for scenario_id in scenario_ids if scenario_id not in by_id]
        if unknown:
            raise serializers.ValidationError(f"Unknown scenarios: {', '.join(unknown)}")
        return [by_id[scenario_id] for scenario_id in scenario_ids]

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        scenarios: List[Scenario] = attrs["scenario_ids"]
        steps = sum(len(scenario.definition.get("steps", [])) for scenario in scenarios)
        if steps > settings.SCENARIOS_SYNC_MAX_STEPS:
            raise serializers.ValidationError(
                {"scenario_ids": [f"{steps} steps, at most {settings.SCENARIOS_SYNC_MAX_STEPS}: run fewer scenarios"]}
            )
        version: Optional[WorkflowVersion] = attrs.get("workflow_version")
        if version is not None:
            other = [
                scenario.name
                for scenario in scenarios
                if scenario.kind == ScenarioKind.ENTITY and scenario.entity_type_id != version.workflow.entity_type_id
            ]
            if other:
                raise serializers.ValidationError(
                    {"workflow_version_id": [f"Not a workflow version of the entity type of: {', '.join(other)}"]}
                )
        return attrs


class FormProblemSerializer(serializers.Serializer):
    code = serializers.CharField()
    path = serializers.CharField(allow_null=True)
    message = serializers.CharField()
    answer = serializers.CharField(allow_null=True)


class ChangeSerializer(serializers.Serializer):
    source = serializers.CharField()
    target = serializers.CharField()
    before = serializers.JSONField()
    after = serializers.JSONField()


class FollowupResultSerializer(serializers.Serializer):
    """A followup condition as the app evaluates it: the values it read, typed as on the device."""

    id = serializers.IntegerField(source="followup.id")
    order = serializers.IntegerField(source="followup.order")
    condition = serializers.JSONField(source="followup.condition")
    forms = serializers.ListField(source="followup.form_ids", child=serializers.CharField())
    read = serializers.JSONField(source="result.read")
    value = serializers.BooleanField(source="result.value")
    error = serializers.SerializerMethodField()

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_error(self, offered) -> Optional[str]:
        return str(offered.result.error) if offered.result.error else None


class NextFormsSerializer(serializers.Serializer):
    forms = serializers.ListField(source="form_ids", child=serializers.CharField())
    followups = FollowupResultSerializer(many=True)


class SearchFieldSerializer(serializers.Serializer):
    name = serializers.CharField()
    label = serializers.CharField()


class SearchStepSerializer(serializers.Serializer):
    questions = SearchFieldSerializer(
        many=True, help_text="The questions asked, the entity type's fields_duplicate_search in the reference form"
    )
    prevent_add = serializers.BooleanField(
        help_text="prevent_add_if_duplicate_found: registering needs every field filled"
    )


class ScenarioStepPrepareResponseSerializer(serializers.Serializer):
    form = serializers.CharField(allow_null=True, help_text="None: the app offers no form there")
    xform = serializers.CharField(
        allow_null=True, help_text="The XForm, the prefill and the answers given as its default values"
    )
    prefilled = serializers.DictField(child=serializers.CharField(), help_text="Question -> value, as the phone does")
    offered = serializers.ListField(
        child=serializers.CharField(), allow_null=True, help_text="The forms the app offers at this point (form_id)"
    )
    next = NextFormsSerializer(
        allow_null=True, help_text="The follow-ups as the app evaluates them at this point; none for the first step"
    )
    profile = serializers.DictField(
        child=serializers.JSONField(), help_text="The entity's information at this point, as stored on the entity"
    )
    search = SearchStepSerializer(
        allow_null=True, help_text="Registering: the search the app asks for before the form; none otherwise"
    )


class StepResultSerializer(serializers.Serializer):
    """A step's result; the profile, copy rules and forms offered are the entity steps' only."""

    index = serializers.IntegerField()
    form = serializers.SerializerMethodField()
    description = serializers.CharField(source="step.description")
    at = serializers.DateTimeField(source="step.at", required=False, allow_null=True)
    status = serializers.CharField()
    failures = serializers.ListField(child=serializers.CharField())
    answers = serializers.DictField(source="step.answers", child=serializers.CharField())
    prefilled = serializers.DictField(child=serializers.CharField())
    submission = serializers.DictField(child=serializers.JSONField())  # text, or null when empty
    problems = FormProblemSerializer(many=True)
    changes = ChangeSerializer(many=True, required=False)
    profile = serializers.DictField(child=serializers.JSONField(), required=False)
    offered_before = NextFormsSerializer(required=False, allow_null=True)
    next = NextFormsSerializer(required=False, allow_null=True)

    @extend_schema_field(serializers.CharField())
    def get_form(self, step_result) -> str:
        return getattr(step_result.step, "form", None) or self.context.get("scenario_form", "")


class FormDescriptionSerializer(serializers.Serializer):
    name = serializers.CharField()
    labels = serializers.DictField(child=serializers.CharField(), help_text="Question name -> label")


class ScenarioOutcomeSerializer(serializers.Serializer):
    id = serializers.IntegerField(source="scenario.id", allow_null=True, help_text="None for a preview")
    name = serializers.CharField(source="scenario.name")
    kind = serializers.CharField(source="scenario.kind")
    status = serializers.CharField()
    workflow_version_id = serializers.IntegerField(source="workflow_version.id", allow_null=True, default=None)
    failed_step = serializers.IntegerField(allow_null=True)
    failures = serializers.ListField(child=serializers.CharField())
    forms = serializers.DictField(child=FormDescriptionSerializer(), help_text="form_id -> the form, for people")
    steps = serializers.SerializerMethodField()

    @extend_schema_field(StepResultSerializer(many=True))
    def get_steps(self, outcome) -> List[Dict[str, Any]]:
        context = {"scenario_form": outcome.scenario.definition.get("form", "")}
        return StepResultSerializer(outcome.steps, many=True, context=context).data


class ScenarioRunResponseSerializer(serializers.Serializer):
    results = ScenarioOutcomeSerializer(many=True)
