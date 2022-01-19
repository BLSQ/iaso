from uuid import uuid4
from django.db import models
from django.conf import settings


## Remove blank=True, null=True on FK once the modles are sets and validated
from iaso.models import Instance, Form


class EntityType(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    defining_form = models.ForeignKey(Form, blank=True, null=True, on_delete=models.PROTECT)

    def __str__(self):
        return f"{self.name}"


"""Define the clients """


class Entity(models.Model):
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    entity_type = models.ForeignKey(EntityType, blank=True, null=True, on_delete=models.PROTECT)
    attributes = models.ForeignKey(Instance, blank=True, null=True, on_delete=models.PROTECT)

    class Meta:
        verbose_name_plural = "Entities"

    def __str__(self):
        return f"{self.name}"
