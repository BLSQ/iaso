from django.db import models
from django.contrib.postgres.fields import JSONField
from django.utils.translation import gettext as _
from uuid import uuid4
from iaso.models import Group

VIRUSES = [
    ("PV1", _("PV1")),
    ("PV2", _("PV2")),
    ("PV3", _("PV3")),
    ("cVDPV2", _("cVDPV2")),
]

VACINES = [
    ("mOPV2", _("mOPV2")),
    ("nOPV2", _("nOPV2")),
    ("bOPV", _("bOPV")),
]

RESPONSIBLES = [
    ("WHO", _("WHO")),
    ("UNICEF", _("UNICEF")),
    ("NAT", _("National")),
    ("MOH", _("MOH")),
    ("PROV", _("PROVINCE")),
    ("DIST", _("District")),
]

STATUS = [
    ("PENDING", _("Pending")),
    ("ONGOING", _("Ongoing")),
    ("FINISHED", _("Finished")),
]

PAYMENT = [
    ("DIRECT", _("Direct")),
    ("DFC", _("DFC")),
]


class Round(models.Model):
    started_at = models.DateField(null=True, blank=True)
    ended_at = models.DateField(null=True, blank=True)
    mop_up_started_at = models.DateField(null=True, blank=True)
    mop_up_ended_at = models.DateField(null=True, blank=True)
    im_started_at = models.DateField(null=True, blank=True)
    im_ended_at = models.DateField(null=True, blank=True)
    lqas_started_at = models.DateField(null=True, blank=True)
    lqas_ended_at = models.DateField(null=True, blank=True)
    target_population = models.IntegerField(null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)


class Campaign(models.Model):
    id = models.UUIDField(default=uuid4, primary_key=True, editable=False)
    epid = models.CharField(default=None, max_length=255, null=True, blank=True)
    obr_name = models.CharField(max_length=255)
    gpei_coordinator = models.CharField(max_length=255, null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    initial_org_unit = models.ForeignKey(
        "iaso.orgunit", null=True, blank=True, on_delete=models.SET_NULL, related_name="campaigns"
    )

    group = models.ForeignKey(
        Group,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="campaigns",
        default=None,
        limit_choices_to={"domain", "POLIO"},
    )

    onset_at = models.DateField(
        null=True,
        help_text=_("When the campaign starts"),
        blank=True,
    )

    three_level_call_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("3 level call"),
    )

    cvdpv_notified_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("cVDPV Notication"),
    )
    cvdpv2_notified_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("cVDPV2 Notication"),
    )

    pv_notified_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("PV Notication"),
    )

    pv2_notified_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("PV2 Notication"),
    )

    virus = models.CharField(max_length=6, choices=VIRUSES, null=True, blank=True)
    vacine = models.CharField(max_length=5, choices=VACINES, null=True, blank=True)

    # Detection
    detection_status = models.CharField(default="PENDING", max_length=10, choices=STATUS)
    detection_responsible = models.CharField(max_length=10, choices=RESPONSIBLES, null=True, blank=True)
    detection_first_draft_submitted_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("1st Draft Submission"),
    )
    detection_rrt_oprtt_approval_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("RRT/OPRTT Approval"),
    )

    # Risk Assessment
    risk_assessment_status = models.CharField(max_length=10, choices=STATUS, null=True, blank=True)
    risk_assessment_responsible = models.CharField(max_length=10, choices=RESPONSIBLES, null=True, blank=True)
    investigation_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Field Investigation Date"),
    )
    risk_assessment_first_draft_submitted_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("1st Draft Submission"),
    )
    risk_assessment_rrt_oprtt_approval_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("RRT/OPRTT Approval"),
    )
    ag_nopv_group_met_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("AG/nOPV Group"),
    )
    dg_authorized_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("DG Authorization"),
    )
    verification_score = models.IntegerField(null=True, blank=True)
    # Preparedness
    preperadness_spreadsheet_url = models.URLField(null=True, blank=True)

    # Budget
    budget_status = models.CharField(max_length=10, choices=STATUS, null=True, blank=True)
    budget_responsible = models.CharField(max_length=10, choices=RESPONSIBLES, null=True, blank=True)

    eomg = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("EOMG"),
    )
    no_regret_fund_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )
    payment_mode = models.CharField(max_length=10, choices=PAYMENT, null=True, blank=True)
    # Rounds
    round_one = models.OneToOneField(Round, on_delete=models.PROTECT, related_name="round_one", null=True, blank=True)
    round_two = models.OneToOneField(Round, on_delete=models.PROTECT, related_name="round_two", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Additional fields
    district_count = models.IntegerField(null=True, blank=True)
    budget_submitted_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Budget Submission"),
    )

    def __str__(self):
        return f"{self.epid} {self.obr_name}"

    def last_preparedness(self):
        return self.preparedness_set.order_by("-created_at").first()


class Preparedness(models.Model):
    id = models.UUIDField(default=uuid4, primary_key=True, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE)
    spreadsheet_url = models.URLField()

    national_score = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("National Score"))
    regional_score = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Regional Score"))
    district_score = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("District Score"))

    payload = JSONField()

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self) -> str:
        return f"{self.campaign} - {self.created_at}"
