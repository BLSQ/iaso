from django.db import models
import uuid


## Remove blank=True, null=True on FK once the modles are sets and validated
from iaso.models import Instance, Form, Account
from iaso.utils.models.soft_deletable import SoftDeletableModel


class EntityType(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    reference_form = models.ForeignKey(Form, blank=True, null=True, on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.name}"


"""Define the clients """


class Entity(SoftDeletableModel):
    name = models.CharField(max_length=255)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    entity_type = models.ForeignKey(EntityType, blank=True, on_delete=models.PROTECT)
    attributes = models.OneToOneField(
        Instance, on_delete=models.PROTECT, help_text="instance", related_name="attributes"
    )
    instances = models.ManyToManyField(Instance, blank=True)
    account = models.ForeignKey(Account, on_delete=models.PROTECT)

    class Meta:
        verbose_name_plural = "Entities"

    def __str__(self):
        return f"{self.name}"
