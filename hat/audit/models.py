from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.contrib.postgres.fields import JSONField
from django.db import models
from django.contrib.auth.models import User
from django.core import serializers
import json

CASE_API = "case_api"
VILLAGE_API = "village_api"
PROFILE_API = "profile_api"
PASSWORD_API = "password_api"
PATIENT_API = "patient_api"

class Modification(models.Model):
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    past_value = JSONField()
    new_value = JSONField()
    source = models.TextField()
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.DO_NOTHING)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s - %d - %s - %s" % (self.content_type, self.object_id, self.user, self.created_at)


def log_modification(v1, v2, source, user=None):
    modification = Modification()
    modification.object_id = v1.id
    modification.content_object = v2
    modification.source = source
    modification.past_value = json.loads(serializers.serialize("json", [v1]))
    modification.new_value = json.loads(serializers.serialize("json", [v2]))
    modification.user = user
    modification.save()
