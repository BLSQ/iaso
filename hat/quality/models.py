from django.db import models
from hat.geo.models import Village
from hat.cases.models import CaseAbstract, RES_UNUSED
from hat.patient.models import Test
from django.contrib.auth.models import User


class Check(models.Model):
    test = models.ForeignKey(Test, on_delete=models.CASCADE)
    validator = models.ForeignKey(User, on_delete=models.CASCADE)
    result = models.IntegerField(choices=CaseAbstract.GENERAL_TEST_RESULT_CHOICES,
                                 null=True, blank=True, default=RES_UNUSED)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)



