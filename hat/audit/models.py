from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType

from django.db import models
from django.contrib.auth.models import User
from django.core import serializers
import json

PROFILE_API = "profile_api"
PASSWORD_API = "password_api"
PATIENT_API = "patient_api"
ORG_UNIT_API = "org_unit_api"
ORG_UNIT_API_BULK = "org_unit_api_bulk"
INSTANCE_API = "instance_api"


class Modification(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey("content_type", "object_id")
    past_value = models.JSONField()
    new_value = models.JSONField()
    source = models.TextField()
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s - %d - %s - %s" % (
            self.content_type,
            self.object_id,
            self.user,
            self.created_at,
        )

    def as_dict(self):
        return {
            "id": self.id,
            "content_type": self.content_type.app_label,
            "object_id": self.object_id,
            "past_value": self.past_value,
            "new_value": self.new_value,
            "source": self.source,
            "user": self.user.iaso_profile.as_dict(),
            "created_at": self.created_at,
        }

    def as_list(self):
        return {
            "id": self.id,
            "content_type": self.content_type.app_label,
            "object_id": self.object_id,
            "source": self.source,
            "user": self.user.iaso_profile.as_dict(),
            "created_at": self.created_at,
        }


def log_modification(v1, v2, source, user=None):
    modification = Modification()
    modification.past_value = []
    modification.new_value = []
    if v1:
        modification.object_id = v1.id
        modification.past_value = json.loads(serializers.serialize("json", [v1]))
    elif v2:
        modification.object_id = v2.id
    if v2:
        modification.content_object = v2
        modification.new_value = json.loads(serializers.serialize("json", [v2]))
    elif v1:
        modification.content_object = v1
    modification.source = source
    modification.user = user
    modification.save()
