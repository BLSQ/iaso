from django.db import models
from django.utils.translation import gettext_lazy as _

from iaso.models import *

GENDERS = [("MALE", _("Male")), ("FEMALE", _("Female"))]

EXIT_TYPES = [("DEATH", _("Death")), ("CURED", _("Cured"))]

NUTRITION_PROGRAMMES = [("TSFP", _("TSFP")), ("OTP", _("OTP"))]

PROGRAMME_TYPE = [("PLW", _("PLW")), ("U5", _("U5"))]

ADMISSION_CRITERIAS = [("MUAC", _("MUAC")), ("WHZ", _("WHZ"))]

ADMISSION_TYPES = [
    ("NEW", _("new case")),
    ("NEW_RESPONDANT", _("New respondant")),
    ("NEW_RESPONDANT", _("New respondant")),
    ("REFERRED_FROM_OTP_SAM", _("Referred from OTP (SAM)")),
    ("REFERRED_FROM_SC", _("Referred from SC")),
    ("REFERRED_FROM_TSFP_MAM", _("Referred from TSFP (MAM)")),
    ("RELAPSED", _("Relapsed")),
    ("RETURNED_DEFAULTED", _("Returned defaulter")),
    ("TRANSFER_IF_FROM_OTHER_TSFP", _("Transfer if from other TSFP")),
]


class Beneficiary(models.Model):
    birth_date = models.DateField()
    gender = models.CharField(max_length=8, choices=GENDERS, null=True, blank=True)
    entity_id = models.IntegerField(null=True, blank=True)


class Journey(models.Model):
    beneficiary = models.ForeignKey(Beneficiary, on_delete=models.DO_NOTHING, null=True, blank=True)

    admission_criteria = models.CharField(max_length=255, choices=ADMISSION_CRITERIAS, null=True, blank=True)
    admission_type = models.CharField(max_length=255, choices=ADMISSION_TYPES, null=True, blank=True)
    nutrition_programme = models.CharField(max_length=255, choices=NUTRITION_PROGRAMMES, null=True, blank=True)
    programme_type = models.CharField(max_length=255, choices=PROGRAMME_TYPE, null=True, blank=True)
    weight_gain = models.FloatField(default=0)
    exit_type = models.CharField(max_length=50, choices=EXIT_TYPES, null=True, blank=True)


class Visit(models.Model):
    date = models.DateTimeField(null=True, blank=True)
    number = models.IntegerField(default=1)
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.DO_NOTHING, null=True, blank=True)
    journey = models.ForeignKey(Journey, on_delete=models.DO_NOTHING, null=True, blank=True)


class Step(models.Model):
    assistance_type = models.CharField(max_length=255)
    quantity_given = models.FloatField()
    visit = models.ForeignKey(Visit, on_delete=models.DO_NOTHING, null=True, blank=True)
    instance_id = models.IntegerField(null=True, blank=True)
