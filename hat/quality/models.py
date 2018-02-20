from django.db import models
from hat.geo.models import Village
from hat.cases.models import CaseAbstract
from hat.patient.models import Test
from django.contrib.auth.models import User


class Check(models.Model):
    test = models.ForeignKey(Test)
    validator = models.ForeignKey(User)
    result = models.IntegerField(choices=CaseAbstract.GENERAL_TEST_RESULT_CHOICES, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)



