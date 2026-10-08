"""The scenario files: JSON (see ENTITY-SCENARIO-TESTS.md, "File format"), of two kinds sharing their parts.

- `"kind": "form"` - tests one form's logic: each step fills the form and checks what it gives (calculates) or that it
  refuses the answers (required, constraints, choices). No entity, no workflow.
- `"kind": "entity"` - replays an entity workflow: register an entity, fill the followup forms the app offers, check
  the forms offered and the entity's profile - and each form's logic, with the same checks as a form scenario.

Answers and expected values are text, as in a submission: `"11"`, `"12.0"`, `"yes"` - a number or a boolean is
refused, so is an unknown key. Forms are named by their `form_id` (the XLSForm's id).
"""

import datetime

from typing import Annotated, Any, Dict, List, Literal, Optional, Union

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter


FORMAT = "iaso-scenarios/1"


class StrictModel(BaseModel):
    # strict: "11" is an answer, 11 is a mistake (a number or a boolean is refused, not converted); an unknown key is
    # a typo, refused too
    model_config = ConfigDict(strict=True, extra="forbid", populate_by_name=True)


# parts shared by both kinds


class Refusal(StrictModel):
    question: str = Field(description="The question the form refuses, by name.")
    code: Literal["REQUIRED", "CONSTRAINT", "NOT_RELEVANT", "UNKNOWN_CHOICE", "INVALID", "READ_ONLY"] = Field(
        description="Why: REQUIRED (left empty), CONSTRAINT (breaks the question's constraint), NOT_RELEVANT "
        "(answered while hidden), UNKNOWN_CHOICE, INVALID (not a value of the question's type), READ_ONLY."
    )


class FormExpect(StrictModel):
    submission: Dict[str, Optional[str]] = Field(
        default_factory=dict,
        description="Question -> expected value in the form as filled (calculates included), as text; null: empty "
        "or not relevant.",
    )
    refused: Optional[List[Refusal]] = Field(
        None,
        description="The form must refuse the answers, for these reasons exactly; nothing is then saved, as in the "
        "app.",
    )


class FillStep(StrictModel):
    description: str = Field("", description="What happens in this step, in plain words.")
    answers: Dict[str, str] = Field(default_factory=dict, description="Question name -> answer, as text.")
    context: Dict[str, str] = Field(
        default_factory=dict,
        description="Values given to the form's questions of the same name, as the app does for the org unit "
        "(current_ou_id...).",
    )


class ScenarioBase(StrictModel):
    schema_url: Optional[str] = Field(None, alias="$schema", description="The JSON Schema of this file, for editors.")
    format: Literal["iaso-scenarios/1"] = Field(FORMAT, description="The version of this file format.")
    name: str
    description: str = Field("", description="What this scenario checks, in plain words.")


# "kind": "form"


class FormStep(FillStep):
    expect: FormExpect = Field(default_factory=FormExpect)


class FormScenario(ScenarioBase):
    kind: Literal["form"] = "form"
    form: str = Field(description="The form tested, by its form_id (the XLSForm id); its latest version.")
    context: Dict[str, str] = Field(default_factory=dict, description="Context of every step, see the step's.")
    steps: List[FormStep] = Field(description="Independent fills of the form.")


# "kind": "entity"


class EntityExpect(FormExpect):
    next_forms: Optional[List[str]] = Field(None, description="The forms offered after this step, in the app's order.")
    attributes: Dict[str, Optional[str]] = Field(
        default_factory=dict,
        description="Profile question -> expected answer after this step, as text; null: not answered.",
    )


class EntityStep(FillStep):
    form: str = Field(description="The form filled, by its form_id (the XLSForm id).")
    at: Optional[datetime.datetime] = Field(
        None, description="The step's clock (current_date... in the followup conditions), ISO 8601."
    )
    force: bool = Field(False, description="Fill the form even if the app wouldn't offer it.")
    expect: EntityExpect = Field(default_factory=EntityExpect)


class EntityScenario(ScenarioBase):
    kind: Literal["entity"] = "entity"
    steps: List[EntityStep] = Field(
        description="The first step registers the entity with the reference form (again if the form refused it); "
        "each next step fills a form the app offers."
    )


Scenario = Annotated[Union[EntityScenario, FormScenario], Field(discriminator="kind")]

_SCENARIO = TypeAdapter(Scenario)


def load_scenario(text: str) -> Union[EntityScenario, FormScenario]:
    """A scenario file's content, of either kind (`"kind"` is required in a file)."""
    # JSON mode: an ISO 8601 text is a datetime even in strict mode
    return _SCENARIO.validate_json(text)


def json_schema() -> Dict[str, Any]:
    """The JSON Schema of a scenario file, for editors (`"$schema"`) and imports."""
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "title": "IASO scenario",
        **_SCENARIO.json_schema(by_alias=True),
    }
