from django.contrib.auth import get_user_model
from django.db import models

from ..common import CreatedAndUpdatedModel
from .templates import ValidationState


class ValidationStatus(CreatedAndUpdatedModel):
    # workflow = models.ForeignKey(ValidationWorfklow, on_delete=models.CASCADE) -> Martin: I don't like having this here. I think the workflow  for a submission should be found as the workflow for the Form of that submission. For org units, it will be the validation workflow of the org unit type
    current_state = models.ForeignKey(
        ValidationState, on_delete=models.CASCADE
    )  # martin's note, I don't see the point of instantiating statetemplates into stateobject. A state should be immutable and a submission should be in only one state at the time, that makes it easier to think about it (even though I do see cases where this will make the creation of the workflow more complex to think of all combinations)

    created_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.PROTECT, related_name="%(class)s_created_set"
    )


class ValidationHistoryStep(
    CreatedAndUpdatedModel
):  # loading the list of these will give us directly the history of the validation
    # the from state will be the to_state from the previous step, no need to store it twice
    status = models.OneToOneField(ValidationStatus, on_delete=models.CASCADE)
    to_state_object = models.ForeignKey(
        ValidationState, null=True, on_delete=models.CASCADE, related_name="incoming_steps"
    )

    # step_template = models.ForeignKey(ValidationStepTemplate, on_delete=models.CASCADE, related_name="step_objects") maybe worth keeping for debug purpose

    updated_by = models.ForeignKey(get_user_model(), null=True, blank=True, on_delete=models.PROTECT)
    comment = models.TextField(blank=True)
