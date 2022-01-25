from uuid import uuid4
from django.db import models
import uuid
from django.conf import settings


## Remove blank=True, null=True on FK once the modles are sets and validated
from iaso.models import Instance, Form
from iaso.utils.models.soft_deletable import SoftDeletableModel


class EntityType(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    defining_form = models.ForeignKey(Form, blank=True, null=True, on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.name}"


"""Define the clients """


class Entity(SoftDeletableModel):
    name = models.CharField(max_length=255)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    entity_type = models.ForeignKey(EntityType, blank=True, null=True, on_delete=models.PROTECT)
    attributes = models.OneToOneField(Instance, blank=True, null=True, on_delete=models.PROTECT, help_text="instance")

    class Meta:
        verbose_name_plural = "Entities"

    def __str__(self):
        return f"{self.name}"

    def as_json(self):
        return dict(
            name=self.name,
            uuid=self.uuid,
            created_at=self.created_at,
            updated_at=self.updated_at,
            entity_type=self.entity_type,
            attributes=self.attributes,
        )
