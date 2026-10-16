"""The configuration reading the questions a new form version removes or modifies, so that whoever uploads it can
check it: one entry per reference, saying what it is (`kind`) and the object to check (`target_id`, `target_name`),
see `common.ConfigurationImpact`. One module per domain, implementing `common.ImpactFunction`."""

import typing

from .common import ConfigurationImpact, ImpactFunction
from .dhis2_impacts import dhis2_impacts
from .entity_types_impacts import entity_types_impacts
from .forms_impacts import forms_impacts
from .stock_impacts import stock_impacts
from .workflows_impacts import workflows_impacts


if typing.TYPE_CHECKING:
    from iaso.models import FormVersion


IMPACT_FUNCTIONS: typing.Tuple[ImpactFunction, ...] = (
    forms_impacts,
    entity_types_impacts,
    stock_impacts,
    dhis2_impacts,
    workflows_impacts,
)


def compute_configuration_impacts(
    previous_form_version: "FormVersion",
    removed_question_names: typing.Set[str],
    modified_question_names: typing.Set[str],
) -> typing.List[ConfigurationImpact]:
    """The configuration reading these removed or modified questions of the form of `previous_form_version`."""
    if not removed_question_names | modified_question_names:
        return []
    return [
        result
        for impact_function in IMPACT_FUNCTIONS
        for result in impact_function(previous_form_version, removed_question_names, modified_question_names)
    ]
