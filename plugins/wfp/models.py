from django.db import models
from django.utils.translation import gettext_lazy as _

from iaso.models import Account, OrgUnit
from plugins.wfp.models import *


GENDERS = [("Male", _("Male")), ("Female", _("Female"))]

EXIT_TYPES = [
    ("death", _("Death")),
    ("cured", _("Cured")),
    ("dismissed_due_to_cheating", _("Dismissal")),
    ("voluntary_withdrawal", _("Voluntary Withdrawal")),
    ("transfer_to_otp", _("Transfer To OTP")),
    ("transfer_to_tsfp", _("Transfer To TSFP")),
    ("non_respondent", _("Non respondent")),
    ("transferred_out", _("Transferred out")),
    ("defaulter", _("Defaulter")),
    ("other", _("Other")),
]

NUTRITION_PROGRAMMES = [
    ("TSFP", _("TSFP")),
    ("OTP", _("OTP")),
    ("breastfeeding", _("Breastfeeding")),
    ("pregnant", _("Pregnant")),
]

PROGRAMME_TYPE = [("PLW", _("PLW")), ("U5", _("U5"))]

ADMISSION_CRITERIAS = [
    ("muac", _("MUAC")),
    ("whz", _("WHZ")),
    ("oedema", _("OEDEMA")),
    ("child_wasted", _("By wasted child")),
]

ADMISSION_TYPES = [
    ("new_case", _("New case")),
    ("readmission_as_non_respondent", _("Readmission as non-respondent")),
    ("referred_from_otp_sam", _("Referred from OTP (SAM)")),
    ("referred_from_sc", _("Referred from SC")),
    ("referred_from_tsfp_mam", _("Referred from TSFP (MAM)")),
    ("relapse", _("Relapse")),
    ("returned_defaulter", _("Returned defaulter")),
    ("returned_referral", _("Returned referral")),
    ("transfer_from_other_tsfp", _("Transfer from other TSFP")),
]


# WFP Models


class Beneficiary(models.Model):
    birth_date = models.DateField()
    gender = models.CharField(max_length=8, choices=GENDERS, null=True, blank=True)
    entity_id = models.IntegerField(null=True, blank=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True)


class Journey(models.Model):
    beneficiary = models.ForeignKey(Beneficiary, on_delete=models.CASCADE, null=True, blank=True)
    admission_criteria = models.CharField(max_length=255, choices=ADMISSION_CRITERIAS, null=True, blank=True)
    admission_type = models.CharField(max_length=255, choices=ADMISSION_TYPES, null=True, blank=True)
    nutrition_programme = models.CharField(max_length=255, choices=NUTRITION_PROGRAMMES, null=True, blank=True)
    programme_type = models.CharField(max_length=255, choices=PROGRAMME_TYPE, null=True, blank=True)
    initial_weight = models.FloatField(default=0)
    discharge_weight = models.FloatField(null=True, blank=True)
    weight_gain = models.FloatField(default=0)
    weight_loss = models.FloatField(default=0)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    duration = models.FloatField(null=True, blank=True)
    exit_type = models.CharField(max_length=50, choices=EXIT_TYPES, null=True, blank=True)
    instance_id = models.IntegerField(null=True, blank=True)


class Visit(models.Model):
    date = models.DateTimeField(null=True, blank=True)
    number = models.IntegerField(default=1)
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.DO_NOTHING, null=True, blank=True)
    journey = models.ForeignKey(Journey, on_delete=models.CASCADE, null=True, blank=True)
    instance_id = models.IntegerField(null=True, blank=True)


class Step(models.Model):
    assistance_type = models.CharField(max_length=255)
    quantity_given = models.FloatField()
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, null=True, blank=True)
    instance_id = models.IntegerField(null=True, blank=True)


class MonthlyStatistics(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True)
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.DO_NOTHING, null=True, blank=True)
    month = models.CharField(max_length=8, null=True, blank=True)
    year = models.CharField(max_length=6, null=True, blank=True)
    gender = models.CharField(max_length=8, choices=GENDERS, null=True, blank=True)
    admission_criteria = models.CharField(max_length=255, choices=ADMISSION_CRITERIAS, null=True, blank=True)
    admission_type = models.CharField(max_length=255, choices=ADMISSION_TYPES, null=True, blank=True)
    exit_type = models.CharField(max_length=50, choices=EXIT_TYPES, null=True, blank=True)
    nutrition_programme = models.CharField(max_length=255, choices=NUTRITION_PROGRAMMES, null=True, blank=True)
    programme_type = models.CharField(max_length=255, choices=PROGRAMME_TYPE, null=True, blank=True)
    number_visits = models.IntegerField(default=0)
    given_sachet_rusf = models.FloatField(null=True, blank=True)
    given_sachet_rutf = models.FloatField(null=True, blank=True)
    given_quantity_csb = models.FloatField(null=True, blank=True)
