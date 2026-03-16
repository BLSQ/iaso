from django.db import models
from django.utils.translation import gettext_lazy as _

from iaso.models import Account, Entity, OrgUnit
from plugins.wfp.models import *


GENDERS = [("Male", _("Male")), ("Female", _("Female"))]

EXIT_TYPES = [
    ("death", _("Death")),
    ("cured", _("Cured")),
    ("dismissed_due_to_cheating", _("Dismissal")),
    ("voluntary_withdrawal", _("Voluntary Withdrawal")),
    ("transfer_to_otp", _("Transfer To OTP")),
    ("transfer_from_other_otp", _("Transfer in from other OTP")),
    ("transfer_to_tsfp", _("Transfer To TSFP")),
    ("transfer_from_other_tsfp", _("Transfer in from other TSFP")),
    ("non_respondent", _("Non respondent")),
    ("transferred_out", _("Transferred out")),
    ("defaulter", _("Defaulter")),
    ("other", _("Other")),
]

NUTRITION_PROGRAMMES = [
    ("TSFP", _("TSFP")),
    ("OTP", _("OTP")),
    ("OTP - Under 6", _("OTP - Under 6")),
    ("BSFP", _("BSFP")),
    ("Not Eligible", _("Not Eligible")),
]
PHYSIOLOGY_STATUS = [
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
    ("referred_from_BSFP", _("Referred from BSFP")),
    ("relapse", _("Relapse")),
    ("returned_defaulter", _("Returned defaulter")),
    ("returned_referral", _("Returned referral")),
    ("transfer_from_other_tsfp", _("Transfer from other TSFP")),
]

RATION_SIZE = [
    ("full", _("Full")),
    ("partial", _("Partial")),
    ("none", _("None")),
    ("More", _("More")),
]

# WFP Models


class Beneficiary(models.Model):
    birth_date = models.DateField()
    gender = models.CharField(max_length=8, choices=GENDERS, null=True, blank=True, db_index=True)
    entity = models.ForeignKey(Entity, on_delete=models.CASCADE, null=True, blank=True, db_index=True)
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True)
    guidelines = models.CharField(max_length=8, null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["account", "id"]),
        ]


class Journey(models.Model):
    beneficiary = models.ForeignKey(Beneficiary, on_delete=models.CASCADE, null=True, blank=True)
    admission_criteria = models.CharField(
        max_length=255,
        choices=ADMISSION_CRITERIAS,
        null=True,
        blank=True,
        db_index=True,
    )
    muac_size = models.CharField(max_length=10, null=True, db_index=True)
    whz_score = models.CharField(max_length=10, null=True, db_index=True)
    admission_type = models.CharField(max_length=255, choices=ADMISSION_TYPES, null=True, blank=True, db_index=True)
    nutrition_programme = models.CharField(
        max_length=255,
        choices=NUTRITION_PROGRAMMES,
        null=True,
        blank=True,
        db_index=True,
    )
    physiology_status = models.CharField(max_length=255, choices=PHYSIOLOGY_STATUS, null=True, blank=True)
    programme_type = models.CharField(max_length=255, choices=PROGRAMME_TYPE, null=True, blank=True, db_index=True)
    initial_weight = models.FloatField(null=True, blank=True)
    discharge_weight = models.FloatField(null=True, blank=True)
    weight_gain = models.FloatField(default=0)
    weight_loss = models.FloatField(default=0)
    start_date = models.DateField(null=True, blank=True, db_index=True)
    end_date = models.DateField(null=True, blank=True, db_index=True)
    duration = models.FloatField(null=True, blank=True)
    exit_type = models.CharField(max_length=50, choices=EXIT_TYPES, null=True, blank=True, db_index=True)
    instance_id = models.IntegerField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["programme_type", "beneficiary", "nutrition_programme"]),
            models.Index(fields=["physiology_status"]),
        ]


class Visit(models.Model):
    date = models.DateTimeField(null=True, blank=True, db_index=True)
    number = models.IntegerField(default=1)
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.DO_NOTHING, null=True, blank=True, db_index=True)
    journey = models.ForeignKey(Journey, on_delete=models.CASCADE, null=True, blank=True)
    muac_size = models.CharField(max_length=10, null=True, db_index=True)
    whz_color = models.CharField(max_length=10, null=True, db_index=True)
    oedema = models.IntegerField(null=True)
    entry_point = models.TextField(null=True)
    instance_id = models.IntegerField(null=True, blank=True, db_index=True)

    class Meta:
        indexes = [
            models.Index(fields=["org_unit", "date", "journey"]),
            models.Index(fields=["muac_size", "whz_color", "oedema"]),
        ]


class Step(models.Model):
    assistance_type = models.CharField(max_length=255, db_index=True)
    quantity_given = models.FloatField()
    ration_size = models.CharField(max_length=50, choices=RATION_SIZE, null=True, blank=True)
    visit = models.ForeignKey(Visit, on_delete=models.CASCADE, null=True, blank=True)
    instance_id = models.IntegerField(null=True, blank=True, db_index=True)


class MonthlyStatistics(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True)
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.DO_NOTHING, null=True, blank=True)
    dhis2_id = models.TextField(null=True)
    month = models.CharField(max_length=8, null=True, blank=True)
    year = models.CharField(max_length=6, null=True, blank=True)
    period = models.CharField(max_length=8, null=True, blank=True)
    gender = models.CharField(max_length=8, choices=GENDERS, null=True, blank=True)
    physiology_status = models.CharField(max_length=255, choices=PHYSIOLOGY_STATUS, null=True, blank=True)
    programme_type = models.CharField(max_length=255, choices=PROGRAMME_TYPE, null=True, blank=True)
    admission_criteria = models.CharField(max_length=255, choices=ADMISSION_CRITERIAS, null=True, blank=True)
    admission_type = models.CharField(max_length=255, choices=ADMISSION_TYPES, null=True, blank=True)
    nutrition_programme = models.CharField(max_length=255, choices=NUTRITION_PROGRAMMES, null=True, blank=True)
    oedema = models.IntegerField(null=True)
    muac_under_11_5 = models.IntegerField(null=True)  # MUAC < 11.5cm
    muac_11_5_12_4 = models.IntegerField(null=True)  # MUAC between 11.5 and 12.4 cm
    muac_above_12_5 = models.IntegerField(null=True)  # MUAC > 12.5 cm
    muac_under_23 = models.IntegerField(null=True)  # MUAC < 23 cm for PBWG
    muac_above_23 = models.IntegerField(null=True)  # MUAC > 23 cm for PBWG
    whz_score_2 = models.IntegerField(null=True)  # WHZ greater than -2 (green)
    whz_score_3 = models.IntegerField(null=True)  # WHZ less than -3 (red)
    whz_score_3_2 = models.IntegerField(null=True)  # WHZ between -2 and -3 (yellow)
    community_health_worker_muac_under_11_5 = models.IntegerField(null=True)
    community_health_worker_muac_11_5_12_4 = models.IntegerField(null=True)
    community_health_worker_oedema = models.IntegerField(null=True)
    community_health_worker_muac_under_23 = models.IntegerField(null=True)
    community_health_worker_muac_above_23 = models.IntegerField(null=True)
    admission_type_new_case = models.IntegerField(null=True)
    admission_type_relapse = models.IntegerField(null=True)
    admission_type_returned_defaulter = models.IntegerField(null=True)
    admission_type_returned_referral = models.IntegerField(null=True)
    admission_type_transfer_from_other_tsfp = models.IntegerField(null=True)
    admission_type_admission_sc_itp_otp = models.IntegerField(null=True)
    admission_type_transfer_sc_itp_otp = models.IntegerField(null=True)
    exit_type_transfer_in_from_other_tsfp = models.IntegerField(null=True)
    exit_type_cured = models.IntegerField(null=True)
    exit_type_death = models.IntegerField(null=True)
    exit_type_defaulter = models.IntegerField(null=True)
    exit_type_non_respondent = models.IntegerField(null=True)
    pregnant = models.IntegerField(null=True)
    breastfeeding = models.IntegerField(null=True)
    number_visits = models.IntegerField(null=True)


class Dhis2SyncResults(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True)
    org_unit_id = models.IntegerField(null=True, blank=True, db_index=True)
    org_unit_dhis2_id = models.TextField(null=True)
    data_set_id = models.TextField(null=True)
    programme_type = models.CharField(max_length=255, choices=PROGRAMME_TYPE, null=True, blank=True)
    status = models.TextField(null=True)
    period = models.CharField(max_length=8, null=True, blank=True)
    month = models.CharField(max_length=8, null=True, blank=True)
    year = models.CharField(max_length=6, null=True, blank=True)
    response = models.JSONField()
    json = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class ScreeningData(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, null=True, blank=True)
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.DO_NOTHING, null=True, blank=True, db_index=True)
    date = models.DateTimeField(null=True, blank=True, db_index=True)
    month = models.CharField(max_length=8, null=True, blank=True)
    year = models.CharField(max_length=6, null=True, blank=True)
    period = models.CharField(max_length=8, null=True, blank=True)
    u5_male_green = models.FloatField(null=True)
    u5_female_green = models.FloatField(null=True)
    u5_male_yellow = models.FloatField(null=True)
    u5_female_yellow = models.FloatField(null=True)
    u5_male_red = models.FloatField(null=True)
    u5_female_red = models.FloatField(null=True)
    u5_male_oedema = models.FloatField(null=True)
    u5_female_oedema = models.FloatField(null=True)
    pregnant_w_muac_gt_23 = models.FloatField(null=True)
    pregnant_w_muac_lte_23 = models.FloatField(null=True)
    lactating_w_muac_gt_23 = models.FloatField(null=True)
    lactating_w_muac_lte_23 = models.FloatField(null=True)
