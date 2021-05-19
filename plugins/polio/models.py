from django.db import models
from django.utils.translation import gettext as _
from uuid import uuid4

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


class Preparedness(models.Model):
    id = models.UUIDField(default=uuid4, primary_key=True, editable=False)
    planning_score = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name=_("Planning, coordination and funding")
    )

    training_score = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Training for SIAs quality"))
    monitoring_score = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name=_("Monitoring and Supervision")
    )
    vaccine_score = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name=_("Vaccine, cold chain and logistics")
    )
    advocacy_score = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name=_("Advocacy, social mobilization and communication")
    )
    adverse_score = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name=_("Adverse Event Following Immunization (AEFI)")
    )
    status_score = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Status of preparedness"))


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
    description = models.TextField(null=True, blank=True)

    initial_org_unit = models.ForeignKey(
        "iaso.orgunit", null=True, blank=True, on_delete=models.SET_NULL, related_name="campaigns"
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

    # Preparedness
    spreadsheet_url = models.URLField(null=True, blank=True)
    preperadness_national_score = models.ForeignKey(Preparedness, null=True, blank=True, on_delete=models.SET_NULL)

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

    # Rounds
    round_one = models.OneToOneField(Round, on_delete=models.PROTECT, related_name="round_one", null=True, blank=True)
    round_two = models.OneToOneField(Round, on_delete=models.PROTECT, related_name="round_two", null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.epid} {self.obr_name}"
