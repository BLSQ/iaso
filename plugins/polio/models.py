from uuid import uuid4

from django.contrib.auth.models import User
from django.db import models
from django.utils.translation import gettext as _
from iaso.models import Group, OrgUnit
from iaso.utils.models.soft_deletable import SoftDeletableModel
from plugins.polio.preparedness.parser import open_sheet_by_url
from plugins.polio.preparedness.spread_cache import CachedSpread

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

LANGUAGES = [
    ("FR", "Français"),
    ("EN", "English"),
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

RA_BUDGET_STATUSES = [
    ("APPROVED", _("Approved")),
    ("TO_SUBMIT", _("To Submit")),
    ("SUBMITTED", _("Submitted")),
    ("REVIEWED", _("Reviewed by RRT")),
]

PREPAREDNESS_SYNC_STATUS = [
    ("QUEUED", _("Queued")),
    ("ONGOING", _("Ongoing")),
    ("FAILURE", _("Failed")),
    ("FINISHED", _("Finished")),
]

PAYMENT = [
    ("DIRECT", _("Direct")),
    ("DFC", _("DFC")),
]

PREPARING = "PREPARING"
ROUND1START = "ROUND1START"
ROUND1DONE = "ROUND1DONE"
ROUND2START = "ROUND2START"
ROUND2DONE = "ROUND2DONE"

ROUNDSTATUS = [
    (PREPARING, _("Preparing")),
    (ROUND1START, _("Round 1 started")),
    (ROUND1DONE, _("Round 1 completed")),
    (ROUND2START, _("Round 2 started")),
    (ROUND2DONE, _("Round 2 completed")),
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
    im_percentage_children_missed_in_household = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.0, null=True, blank=True
    )
    im_percentage_children_missed_out_household = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.0, null=True, blank=True
    )
    im_percentage_children_missed_in_plus_out_household = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.0, null=True, blank=True
    )
    awareness_of_campaign_planning = models.DecimalField(
        max_digits=10, decimal_places=2, default=0.0, null=True, blank=True
    )
    main_awareness_problem = models.CharField(max_length=255, null=True, blank=True)
    lqas_district_passing = models.IntegerField(null=True, blank=True)
    lqas_district_failing = models.IntegerField(null=True, blank=True)


class Campaign(SoftDeletableModel):
    id = models.UUIDField(default=uuid4, primary_key=True, editable=False)
    epid = models.CharField(default=None, max_length=255, null=True, blank=True)
    obr_name = models.CharField(max_length=255, unique=True)
    gpei_coordinator = models.CharField(max_length=255, null=True, blank=True)
    gpei_email = models.EmailField(max_length=254, null=True, blank=True)
    description = models.TextField(null=True, blank=True)

    initial_org_unit = models.ForeignKey(
        "iaso.orgunit", null=True, blank=True, on_delete=models.SET_NULL, related_name="campaigns"
    )

    country = models.ForeignKey(
        "iaso.orgunit",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="campaigns_country",
        help_text="Country for campaign, set automatically from initial_org_unit",
    )

    creation_email_send_at = models.DateTimeField(
        null=True, blank=True, help_text="When and if we sent an email for creation"
    )

    group = models.ForeignKey(
        Group,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="campaigns",
        default=None,
        limit_choices_to={"domain": "POLIO"},
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
    risk_assessment_status = models.CharField(max_length=10, choices=RA_BUDGET_STATUSES, null=True, blank=True)
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
    doses_requested = models.IntegerField(null=True, blank=True)
    # Preparedness
    preperadness_spreadsheet_url = models.URLField(null=True, blank=True)
    preperadness_sync_status = models.CharField(max_length=10, default="FINISHED", choices=PREPAREDNESS_SYNC_STATUS)
    # Surge recruitment
    surge_spreadsheet_url = models.URLField(null=True, blank=True)
    country_name_in_surge_spreadsheet = models.CharField(null=True, blank=True, max_length=256)
    # Budget
    budget_status = models.CharField(max_length=10, choices=RA_BUDGET_STATUSES, null=True, blank=True)
    budget_responsible = models.CharField(max_length=10, choices=RESPONSIBLES, null=True, blank=True)

    who_disbursed_to_co_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Disbursed to CO (WHO)"),
    )

    who_disbursed_to_moh_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Disbursed to MOH (WHO)"),
    )

    unicef_disbursed_to_co_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Disbursed to CO (UNICEF)"),
    )

    unicef_disbursed_to_moh_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Disbursed to MOH (UNICEF)"),
    )

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
    budget_rrt_oprtt_approval_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Budget Approval"),
    )
    budget_submitted_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("Budget Submission"),
    )

    is_preventive = models.BooleanField(default=False, help_text="Preventive campaign")
    enable_send_weekly_email = models.BooleanField(
        default=False, help_text="Activate the sending of a remainder email every week."
    )

    def __str__(self):
        return f"{self.epid} {self.obr_name}"

    def get_districts(self):
        if self.group is None:
            return OrgUnit.objects.none()
        return self.group.org_units.all()

    def get_regions(self):
        return OrgUnit.objects.filter(id__in=self.get_districts().values_list("parent_id", flat=True).distinct())

    def last_preparedness(self):
        return (
            self.preparedness_set.filter(spreadsheet_url=self.preperadness_spreadsheet_url)
            .order_by("-created_at")
            .first()
        )

    def last_surge(self):
        return self.surge_set.filter(spreadsheet_url=self.surge_spreadsheet_url).order_by("-created_at").first()

    def save(self, *args, **kwargs):
        if self.initial_org_unit is not None:
            try:
                country = self.initial_org_unit.ancestors().filter(org_unit_type__category="COUNTRY").first()
                self.country = country
            except OrgUnit.DoesNotExist:
                pass

        super().save(*args, **kwargs)


class Preparedness(models.Model):
    id = models.UUIDField(default=uuid4, primary_key=True, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE)
    spreadsheet_url = models.URLField()

    national_score = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("National Score"))
    regional_score = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Regional Score"))
    district_score = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("District Score"))

    payload = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self) -> str:
        return f"{self.campaign} - {self.created_at}"


class Surge(models.Model):
    id = models.UUIDField(default=uuid4, primary_key=True, editable=False)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE)
    spreadsheet_url = models.URLField()
    surge_country_name = models.CharField(max_length=250, null=True, default=True)
    who_recruitment = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Recruitment WHO"))
    who_completed_recruitment = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name=_("Completed for WHO")
    )
    unicef_recruitment = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Recruitment UNICEF"))
    unicef_completed_recruitment = models.DecimalField(
        max_digits=10, decimal_places=2, verbose_name=_("Completed for UNICEF")
    )

    payload = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def __str__(self) -> str:
        return f"{self.campaign} - {self.created_at}"


class Config(models.Model):
    slug = models.SlugField(unique=True)
    content = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.slug


class CountryUsersGroup(models.Model):
    users = models.ManyToManyField(User, blank=True)
    country = models.OneToOneField(OrgUnit, on_delete=models.CASCADE)
    language = models.CharField(max_length=32, choices=LANGUAGES, default="EN")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.country)


class LineListImport(models.Model):
    file = models.FileField(upload_to="uploads/linelist/% Y/% m/% d/")
    import_result = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)


class URLCache(models.Model):
    url = models.URLField(unique=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return self.url


class SpreadSheetImport(models.Model):
    """A copy of a Google Spreadsheet in the DB, in JSON format

    This allow us to separate the parsing of the datasheet from it's retrieval
    and to keep a history.
    """

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    url = models.URLField()
    content = models.JSONField()
    spread_id = models.CharField(max_length=60, db_index=True)

    @staticmethod
    def create_for_url(spreadsheet_url: str):
        spread = open_sheet_by_url(spreadsheet_url)
        cached_spread = CachedSpread.from_spread(spread)
        return SpreadSheetImport.objects.create(content=cached_spread.c, url=spreadsheet_url, spread_id=spread.id)

    @property
    def cached_spreadsheet(self):
        return CachedSpread(self.content)
