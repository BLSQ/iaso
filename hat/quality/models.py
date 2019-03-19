from django.db import models
from hat.geo.models import Village
from hat.cases.models import CaseAbstract, RES_UNUSED
from hat.patient.models import Test
from django.contrib.auth.models import User
from hat.users.models import LEVEL_1, LEVEL_CHOICES


class Check(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    validator = models.ForeignKey(User, on_delete=models.CASCADE)
    result = models.IntegerField(
        choices=CaseAbstract.GENERAL_TEST_RESULT_CHOICES,
        null=True,
        blank=True,
        default=RES_UNUSED,
    )
    level = models.IntegerField(
        choices=LEVEL_CHOICES, null=True, blank=True, default=LEVEL_1
    )
    comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s - %s - %s" % (self.test, self.validator, self.result)

    def as_dict(self):
        return {
            "test_id": self.id,
            "validator": self.validator.profile.as_dict(),
            "level": self.level,
            "comment": self.comment,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "result": self.result,
        }
