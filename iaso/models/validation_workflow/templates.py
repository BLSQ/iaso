"""
Those models define a static definition of a workflow. (See it as a hardcoded graph template).

Each workflow is made of multiple states and steps (transitions) between those states.
"""

from autoslug import AutoSlugField
from django.contrib.auth import get_user_model
from django.db import models

from iaso.models.base import UserRole
from iaso.models.common import CreatedAndUpdatedModel
from iaso.utils.models.soft_deletable import SoftDeletableModel


class ValidationWorfklow(CreatedAndUpdatedModel, SoftDeletableModel):
    """
    Static definition of a workflow
    """

    name = models.CharField(max_length=256)
    slug = AutoSlugField(populate_from="name", unique=True, always_update=True)
    description = models.TextField(blank=True, max_length=1024)

    created_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.SET_NULL, related_name="%(class)s_created_set"
    )
    updated_by = models.ForeignKey(
        get_user_model(), null=True, blank=True, on_delete=models.SET_NULL, related_name="%(class)s_updated_set"
    )

    def __str__(self):
        return self.name


class ValidationState(CreatedAndUpdatedModel):
    workflow = models.ForeignKey(ValidationWorfklow, on_delete=models.CASCADE, related_name="states")
    name = models.CharField(max_length=256)
    slug = AutoSlugField(populate_from="name")

    # maybe here add a notion of "final state", to be able to filter all submissions that are in the final state of validation
    def __str__(self):
        return self.name


class ValidationStep(CreatedAndUpdatedModel):
    name = models.CharField(max_length=100)
    slug = AutoSlugField(populate_from="name", always_update=True)

    from_state = models.ForeignKey(ValidationState, on_delete=models.CASCADE, related_name="outgoing")
    to_state = models.ForeignKey(ValidationState, on_delete=models.CASCADE, related_name="incoming")

    roles_allowed = models.ManyToManyField(UserRole, blank=True)
    # here, I think we should not ask for multiple roles at once, but rather specifically say which roles can do a step

    # rejection_target = models.ForeignKey(
    #    ValidationStateTemplate, blank=True, null=True, on_delete=models.SET_NULL, related_name="rejection_target"
    # )  # if set : goes to that node on reject, otherwise whole workflow stops, and we send a notification to user.

    # Martin's note: to me, when you reject, for now, by default, you reset the validation state to None for the submission
    # but you store all the steps, so you can still track all the things that have been rejected
    # later on, if we want more complex strategies, we can add rejection steps to send back to a given level, but at least for submissions, there will be a need for re-submissions,
    def __str__(self):
        return f"{self.from_state} -> {self.to_state}"
