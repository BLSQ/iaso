from django.contrib.auth.models import User
from django.db.models import Sum
from django.contrib.gis.db.models.fields import PointField
from django.db import models
import uuid
from django.contrib.postgres.fields import JSONField

from django.db.models import CASCADE, SET_NULL

IMPORT_TYPE = (("orgUnit", "Org Unit"), ("instance", "Form instance"))


class APIImport(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    user = models.ForeignKey(
        User, on_delete=CASCADE, null=True
    )  # Null only when importing from CLI
    import_type = models.TextField(
        max_length=25, choices=IMPORT_TYPE, null=True, blank=True
    )
    json_body = JSONField()
    headers = JSONField(null=True, blank=True)
    has_problem = models.BooleanField(default=False)
    exception = models.TextField(blank=True, default="")

    def __str__(self):
        return "%s - %s - %s - %s" % (
            self.id,
            self.user,
            self.import_type,
            self.created_at,
        )

    def as_dict(self):
        res = {
            "id": self.id,
            "user": self.user.username,
            "created_at": self.created_at,
            "type": self.import_type,
        }

        if self.import_type == "trap":
            res["trap_count"] = self.trap_set.count()
        elif self.import_type == "catch":
            res["catch_count"] = self.catch_set.count()
        elif self.import_type == "target":
            res["target_count"] = self.target_set.count()
        return res
