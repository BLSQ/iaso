"""Entity and related models

The entity concept might feel a bit abstract, so it might be useful to reason about them using a concrete example
(beneficiaries):

- Entities are used to track beneficiaries (=people who will benefit from the help an organization provides). Those
beneficiaries can be of different types (E.g.: Children under 5, Pregnant or lactating women, etc.).
- Those beneficiaries are visited multiple times, so multiple submissions/instances (that we call "records") are
attached to them via the entity_id foreign key of Instance.
- In addition to those records, we also want to track some core metadata about the beneficiary, such as their name,
age,... Because entities can be of very different natures, we avoid hardcoding those fields in the Entity model, and also reuse the form mechanism: each EntityType
has a foreign key to a reference form, and each entity has a foreign key (attributes) to an instance/submission of that
form.
"""
import uuid

from django.contrib.postgres.fields import ArrayField, CITextField
from django.db import models

from iaso.models import Instance, Form, Account
from iaso.utils.models.soft_deletable import SoftDeletableModel


# TODO: Remove blank=True, null=True on FK once the models are sets and validated


class EntityType(models.Model):
    """Its `reference_form` describes the core attributes/metadata about the entity type (in case it refers to a person: name, age, ...)"""

    name = models.CharField(max_length=255)  # Example: "Child under 5"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Link to the reference form that contains the core attribute/metadata specific to this entity type
    reference_form = models.ForeignKey(Form, blank=True, null=True, on_delete=models.PROTECT)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, blank=True, null=True)
    is_active = models.BooleanField(default=False)
    # Fields (subset of the fields from the reference form) that will be shown in the UI - entity list view
    fields_list_view = ArrayField(CITextField(max_length=255, blank=True), size=100, null=True, blank=True)
    # Fields (subset of the fields from the reference form) that will be shown in the UI - entity detail view
    fields_detail_info_view = ArrayField(CITextField(max_length=255, blank=True), size=100, null=True, blank=True)
    # Fields (subset of the fields from the reference form) that will be used to search for duplicate entities
    fields_duplicate_search = ArrayField(CITextField(max_length=255, blank=True), size=100, null=True, blank=True)

    class Meta:
        unique_together = ["name", "account"]

    def __str__(self):
        return f"{self.name}"

    def as_dict(self):
        return {
            "name": self.name,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "reference_form": self.reference_form.as_dict(),
            "account": self.account.as_dict(),
        }


class Entity(SoftDeletableModel):
    """An entity represents a physical object or person with a known Entity Type

    Contrary to forms, they are not linked to a specific OrgUnit.
    The core attributes that define this entity are not stored as fields in the Entity model, but in an Instance /
    submission
    """

    name = models.CharField(max_length=255)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    entity_type = models.ForeignKey(EntityType, blank=True, on_delete=models.PROTECT)
    attributes = models.OneToOneField(
        Instance, on_delete=models.PROTECT, help_text="instance", related_name="attributes", blank=True, null=True
    )
    account = models.ForeignKey(Account, on_delete=models.PROTECT)

    class Meta:
        verbose_name_plural = "Entities"

    def __str__(self):
        return f"{self.name}"

    def as_dict(self):
        instances = dict()

        for i in self.instances.all():
            instances["uuid"] = i.uuid
            instances["file_name"]: i.file_name
            instances[str(i.name)] = i.name

        return {
            "id": self.pk,
            "uuid": self.uuid,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "entity_type": self.entity_type.as_dict(),
            "attributes": self.attributes.as_dict(),
            "instances": instances,
            "account": self.account.as_dict(),
        }
