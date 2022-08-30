from django.db import models
from django.contrib.postgres.fields import ArrayField, CITextField
import uuid

## Remove blank=True, null=True on FK once the modles are sets and validated
from django.db.models import UniqueConstraint

from iaso.models import Instance, Form, Account
from iaso.utils.models.soft_deletable import SoftDeletableModel


class EntityType(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reference_form = models.ForeignKey(Form, blank=True, null=True, on_delete=models.PROTECT)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, blank=True, null=True)
    # List of field we will show for this entity in list and detail view.
    fields_list_view = ArrayField(CITextField(max_length=255, blank=True), size=100, null=True, blank=True)
    fields_detail_view = ArrayField(CITextField(max_length=255, blank=True), size=100, null=True, blank=True)

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


"""Define the clients """


class Entity(SoftDeletableModel):
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
