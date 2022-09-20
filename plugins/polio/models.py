from uuid import uuid4

from django.contrib.auth.models import User
from django.db import models
from django.db.models import Count
from django.utils.translation import gettext as _
from gspread.utils import extract_id_from_url

from iaso.models import Group, OrgUnit
from iaso.models.microplanning import Team
from iaso.utils.models.soft_deletable import SoftDeletableModel
from plugins.polio.preparedness.parser import open_sheet_by_url, surge_indicator_for_country

from plugins.polio.preparedness.spread_cache import CachedSpread

VIRUSES = [
    ("PV1", _("PV1")),
    ("PV2", _("PV2")),
    ("PV3", _("PV3")),
    ("cVDPV2", _("cVDPV2")),
    ("WPV1", _("WPV1")),
]

VACCINES = [
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


def make_group_round_scope():
    return Group.objects.create(name="hidden roundScope")


class RoundScope(models.Model):
    "Scope (selection of orgunit) for a round and vaccines"

    group = models.OneToOneField(
        Group, on_delete=models.CASCADE, related_name="roundScope", default=make_group_round_scope
    )
    round = models.ForeignKey("Round", on_delete=models.CASCADE, related_name="scopes")

    vaccine = models.CharField(max_length=5, choices=VACCINES)

    class Meta:
        unique_together = [("round", "vaccine")]
        ordering = ["round", "vaccine"]


def make_group_campaign_scope():
    return Group.objects.create(name="hidden campaignScope")


class CampaignScope(models.Model):
    """Scope (selection of orgunit) for a campaign and vaccines"""

    group = models.OneToOneField(
        Group, on_delete=models.CASCADE, related_name="campaignScope", default=make_group_campaign_scope
    )
    campaign = models.ForeignKey("Campaign", on_delete=models.CASCADE, related_name="scopes")
    vaccine = models.CharField(max_length=5, choices=VACCINES)

    class Meta:
        unique_together = [("campaign", "vaccine")]
        ordering = ["campaign", "vaccine"]


class Round(models.Model):
    class Meta:
        ordering = ["number", "started_at"]

    started_at = models.DateField(null=True, blank=True)
    number = models.IntegerField(null=True, blank=True)
    campaign = models.ForeignKey("Campaign", related_name="rounds", on_delete=models.PROTECT, null=True)

    ended_at = models.DateField(null=True, blank=True)
    mop_up_started_at = models.DateField(null=True, blank=True)
    mop_up_ended_at = models.DateField(null=True, blank=True)
    im_started_at = models.DateField(null=True, blank=True)
    im_ended_at = models.DateField(null=True, blank=True)
    lqas_started_at = models.DateField(null=True, blank=True)
    lqas_ended_at = models.DateField(null=True, blank=True)
    target_population = models.IntegerField(null=True, blank=True)
    doses_requested = models.IntegerField(null=True, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0.0, null=True, blank=True)
    im_percentage_children_missed_in_household = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    im_percentage_children_missed_out_household = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    im_percentage_children_missed_in_plus_out_household = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    awareness_of_campaign_planning = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    main_awareness_problem = models.CharField(max_length=255, null=True, blank=True)
    lqas_district_passing = models.IntegerField(null=True, blank=True)
    lqas_district_failing = models.IntegerField(null=True, blank=True)

    # Preparedness
    preparedness_spreadsheet_url = models.URLField(null=True, blank=True)
    preparedness_sync_status = models.CharField(max_length=10, default="FINISHED", choices=PREPAREDNESS_SYNC_STATUS)

    def get_item_by_key(self, key):
        return getattr(self, key)


class Campaign(SoftDeletableModel):
    class Meta:
        ordering = ["obr_name"]

    id = models.UUIDField(default=uuid4, primary_key=True, editable=False)
    epid = models.CharField(default=None, max_length=255, null=True, blank=True)
    obr_name = models.CharField(max_length=255, unique=True)
    gpei_coordinator = models.CharField(max_length=255, null=True, blank=True)
    gpei_email = models.EmailField(max_length=254, null=True, blank=True)
    description = models.TextField(null=True, blank=True)
    separate_scopes_per_round = models.BooleanField(default=False)
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
        verbose_name=_("cVDPV Notification"),
    )
    cvdpv2_notified_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("cVDPV2 Notification"),
    )

    pv_notified_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("PV Notification"),
    )

    pv2_notified_at = models.DateField(
        null=True,
        blank=True,
        verbose_name=_("PV2 Notification"),
    )

    virus = models.CharField(max_length=6, choices=VIRUSES, null=True, blank=True)
    # Deprecated
    vacine = models.CharField(max_length=5, choices=VACCINES, null=True, blank=True)

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
    # Preparedness DEPRECATED -> Moved to round
    preperadness_spreadsheet_url = models.URLField(null=True, blank=True)
    preperadness_sync_status = models.CharField(max_length=10, default="FINISHED", choices=PREPAREDNESS_SYNC_STATUS)
    # Surge recruitment
    surge_spreadsheet_url = models.URLField(null=True, blank=True)
    country_name_in_surge_spreadsheet = models.CharField(null=True, blank=True, max_length=256)
    # Budget
    budget_status = models.CharField(max_length=10, choices=RA_BUDGET_STATUSES, null=True, blank=True)
    budget_responsible = models.CharField(max_length=10, choices=RESPONSIBLES, null=True, blank=True)
    is_test = models.BooleanField(default=False)
    last_budget_event = models.ForeignKey(
        "BudgetEvent", null=True, blank=True, on_delete=models.SET_NULL, related_name="lastbudgetevent"
    )

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
    round_one = models.OneToOneField(
        Round, on_delete=models.PROTECT, related_name="campaign_round_one", null=True, blank=True
    )
    round_two = models.OneToOneField(
        Round, on_delete=models.PROTECT, related_name="campaign_round_two", null=True, blank=True
    )
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
        default=False, help_text="Activate the sending of a reminder email every week."
    )

    def __str__(self):
        return f"{self.epid} {self.obr_name}"

    def get_item_by_key(self, key):
        return getattr(self, key)

    def get_districts_for_round_number(self, round_number):
        if self.separate_scopes_per_round:
            return OrgUnit.objects.filter(groups__roundScope__round__number=round_number).filter(
                groups__roundScope__round__campaign=self
            )
        return self.get_campaign_scope_districts()

    def get_districts_for_round(self, round):
        if self.separate_scopes_per_round:
            districts = OrgUnit.objects.filter(groups__roundScope__round=round)
        else:
            districts = self.get_campaign_scope_districts()
        return districts

    def get_campaign_scope_districts(self):
        # Get districts on campaign scope, make only sense if separate_scopes_per_round=True
        return OrgUnit.objects.filter(groups__campaignScope__campaign=self)

    def get_all_districts(self):
        """District from all round merged as one"""
        if self.separate_scopes_per_round:
            return OrgUnit.objects.filter(groups__roundScope__round__campaign=self)
        return self.get_campaign_scope_districts()

    def last_surge(self):
        spreadsheet_url = self.surge_spreadsheet_url
        ssi = SpreadSheetImport.last_for_url(spreadsheet_url)
        if not ssi:
            return None
        cs = ssi.cached_spreadsheet

        surge_country_name = self.country_name_in_surge_spreadsheet
        if not surge_country_name:
            return None
        response = surge_indicator_for_country(cs, surge_country_name)
        response["created_at"] = ssi.created_at
        return response

    def save(self, *args, **kwargs):
        if self.initial_org_unit is not None:
            try:
                country = self.initial_org_unit.ancestors().filter(org_unit_type__category="COUNTRY").first()
                self.country = country
            except OrgUnit.DoesNotExist:
                pass

        super().save(*args, **kwargs)

    @property
    def vaccines(self):
        if self.separate_scopes_per_round:
            vaccines = set()
            for round in self.rounds.all():
                for scope in round.scopes.annotate(orgunits_count=Count("group__org_units")).filter(
                    orgunits_count__gte=1
                ):
                    vaccines.add(scope.vaccine)
            return ", ".join(list(vaccines))
        else:
            return ",".join(
                scope.vaccine
                for scope in self.scopes.annotate(orgunits_count=Count("group__org_units")).filter(
                    orgunits_count__gte=1
                )
            )

    def get_round_one(self):
        try:
            round = self.rounds.get(number=1)
            return round
        except Round.DoesNotExist:
            return None

    def get_round_two(self):
        try:
            round = self.rounds.get(number=2)
            return round
        except Round.DoesNotExist:
            return None


# Deprecated
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


# Deprecated
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

    This allows us to separate the parsing of the datasheet from its retrieval
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

    @staticmethod
    def last_for_url(spreadsheet_url: str):
        if not spreadsheet_url:
            return None
        spread_id = extract_id_from_url(spreadsheet_url)

        ssis = SpreadSheetImport.objects.filter(spread_id=spread_id)

        if not ssis:
            # No import yet
            return None
        return ssis.latest("created_at")


class CampaignGroup(SoftDeletableModel):
    def __str__(self):
        return f"{self.name} {','.join(str(c) for c in self.campaigns.all())}"

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.CharField(max_length=200)
    campaigns = models.ManyToManyField(Campaign, related_name="grouped_campaigns")


class BudgetEvent(SoftDeletableModel):

    TYPES = (
        ("submission", "Budget Submission"),
        ("comments", "Comments"),
        ("validation", "Approval"),
        ("request", "Request"),
        ("feedback", "Feedback"),
        ("review", "Review"),
        ("transmission", "Transmission"),
    )

    STATUS = (("validation_ongoing", "Validation Ongoing"), ("validated", "Validated"))

    campaign = models.ForeignKey(Campaign, on_delete=models.PROTECT, related_name="budget_events")
    type = models.CharField(choices=TYPES, max_length=200)
    author = models.ForeignKey(User, blank=False, null=False, on_delete=models.PROTECT)
    internal = models.BooleanField(default=False)
    target_teams = models.ManyToManyField(Team)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(choices=STATUS, max_length=200, null=True, default="validation_ongoing")
    cc_emails = models.CharField(max_length=200, blank=True, null=True)
    comment = models.TextField(blank=True, null=True)
    links = models.TextField(blank=True, null=True)
    is_finalized = models.BooleanField(default=False)
    is_email_sent = models.BooleanField(default=False)
    amount = models.DecimalField(blank=True, null=True, decimal_places=2, max_digits=14)

    def __str__(self):
        return str(self.campaign)

    def save(self, *args, **kwargs):
        super(BudgetEvent, self).save(*args, **kwargs)
        if self.campaign.last_budget_event is None:
            self.campaign.last_budget_event = self
        elif self.campaign.last_budget_event.created_at < self.created_at:
            self.campaign.last_budget_event = self
        self.campaign.save()


class BudgetFiles(models.Model):
    event = models.ForeignKey(BudgetEvent, on_delete=models.PROTECT, related_name="event_files")
    file = models.FileField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Budget File"
        verbose_name_plural = "Budget Files"

    def __str__(self):
        return str(self.event)
