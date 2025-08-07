from typing import Union

from django.contrib.auth.models import AnonymousUser, User
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext as _

from iaso.models import OrgUnit
from iaso.models.org_unit import OrgUnit


class LqasBaseModel(models.Model):
    round = models.ForeignKey("Round", on_delete=models.CASCADE)
    subactivity = models.ForeignKey("SubActivity", on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        abstract = True

    def clean(self):
        """Custom validation to ensure subactivity belongs to the same round"""
        super().clean()

        if self.subactivity and self.round:
            if self.subactivity.round != self.round:
                raise ValidationError(
                    {"subactivity": _("SubActivity must belong to the same round as the LQAS Activity Stats.")}
                )

    def save(self, *args, **kwargs):
        """Ensure validation runs on save"""
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        if self.subactivity:
            return f"{self._meta.verbose_name} for {self.round} - {self.subactivity}"
        return f"{self._meta.verbose_name} for {self.round}"


class LqasDistrictBaseModel(LqasBaseModel):
    district = models.ForeignKey(OrgUnit, on_delete=models.CASCADE)

    class Meta(LqasBaseModel.Meta):
        abstract = True

    def __str__(self):
        if self.subactivity:
            return f"{self._meta.verbose_name} for {self.round} - {self.subactivity} - {self.district}"
        return f"{self._meta.verbose_name} for {self.round} - {self.district}"


class LqasStatuses(models.TextChoices):
    LQASOK = "1lqasOK", _("1lqasOK")
    LQASDISQUALIFIED = "2lqasDisqualified", _("2lqasDisqualified")
    LQASPOOR = "3lqaspoor", _("3lqaspoor")
    LQASVERYPOOR = "3lqasverypoor", _("3lqasverypoor")
    LQASFAIL = "3lqasFail", _("3lqasFail")
    LQASMODERATE = "3lqasmoderate", _("3lqasmoderate")
    LQASUNDERSAMPLED = "3lqasundersampled", _("3lqasundersampled")
    LQASOVERSAMPLED = "3lqasoversampled", _("3lqasoversampled")
    INSCOPE = "inScope", _("inScope")


class LqasActivityStats(LqasBaseModel):
    lqas_failed = models.IntegerField()
    lqas_passed = models.IntegerField()
    lqas_no_data = models.IntegerField()
    status = models.CharField(max_length=20, choices=LqasStatuses.choices, default=LqasStatuses.INSCOPE)

    JSON_KEYS = {
        "lqas_failed": "lqas_failed",
        "lqas_passed": "lqas_passed",
        "lqas_no_data": "lqas_no_data",
        "status": "status",
    }

    class Meta(LqasBaseModel.Meta):
        verbose_name = _("LQAS Activity Statistics")
        verbose_name_plural = _("LQAS Activity Statistics")
        constraints = [
            models.UniqueConstraint(
                fields=["round", "subactivity"],
                name="unique_lqasactivitystats_round_subactivity",
                condition=models.Q(subactivity__isnull=False),
            ),
            models.UniqueConstraint(
                fields=["round"],
                name="unique_lqasactivitystats_round_no_subactivity",
                condition=models.Q(subactivity__isnull=True),
            ),
        ]


class LqasEntryQuerySet(models.QuerySet):
    def filter_for_user(self, user: Union[User, AnonymousUser]):
        qs = self
        if user.is_authenticated:
            qs = qs.filter(round__campaign__account=user.iaso_profile.account)
        return qs.none()


class LqasEntry(LqasDistrictBaseModel):
    total_children_fmd = models.IntegerField()
    total_children_checked = models.IntegerField()
    total_sites_visited = models.IntegerField()
    status = models.CharField(max_length=20, choices=LqasStatuses.choices, default=LqasStatuses.INSCOPE)
    # manager
    objects = models.Manager.from_queryset(LqasEntryQuerySet)()
    JSON_KEYS = {
        "total_children_fmd": "total_child_fmd",
        "total_children_checked": "total_child_checked",
        "total_sites_visited": "total_sites_visited",
        "status": "status",
        "care_giver_stats": "care_giver_stats",
    }

    class Meta(LqasDistrictBaseModel.Meta):
        verbose_name = _("LQAS Entry")
        verbose_name_plural = _("LQAS Entries")
        constraints = [
            models.UniqueConstraint(
                fields=["round", "subactivity", "district"],
                name="unique_lqasentry_round_subactivity_district",
                condition=models.Q(subactivity__isnull=False),
            ),
            models.UniqueConstraint(
                fields=["round", "district"],
                name="unique_lqasentry_round_district_no_subactivity",
                condition=models.Q(subactivity__isnull=True),
            ),
        ]
        indexes = [
            models.Index(fields=["district", "round"]),
            models.Index(fields=["subactivity", "round"]),
            models.Index(fields=["district", "round", "subactivity"]),
        ]


class LqasCareGiverStats(models.Model):
    lqas_entry = models.OneToOneField("LqasEntry", on_delete=models.CASCADE, related_name="caregiver_stats")
    ratio = models.FloatField()
    best_info_source = models.CharField()
    best_info_ratio = models.FloatField()
    caregivers_informed = models.IntegerField()
    caregivers_informed_ratio = models.FloatField()

    class Meta:
        verbose_name = _("LQAS Care Giver Statistics")


class LqasNoMarkStats(LqasBaseModel):
    other = models.IntegerField()
    child_absent = models.IntegerField()
    non_compliance = models.IntegerField()
    child_was_asleep = models.IntegerField()
    house_not_visited = models.IntegerField()
    child_is_a_visitor = models.IntegerField()
    vaccinated_but_not_fm = models.IntegerField()

    JSON_KEYS = {
        "child_absent": "childabsent",
        "other": "Other",
        "non_compliance": "Non_Compliance",
        "child_was_asleep": "Child_was_asleep",
        "house_not_visited": "House_not_visited",
        "child_is_a_visitor": "Child_is_a_visitor",
        "vaccinated_but_not_fm": "Vaccinated_but_not_FM",
    }

    class Meta(LqasBaseModel.Meta):
        verbose_name = _("LQAS No Finger Mark Statistics")
        verbose_name_plural = _("LQAS No Finger Mark Statistics")
        constraints = [
            models.UniqueConstraint(
                fields=["round", "subactivity"],
                name="unique_lqasnomarkstats_round_subactivity",
                condition=models.Q(subactivity__isnull=False),
            ),
            models.UniqueConstraint(
                fields=["round"],
                name="unique_lqasnomarkstats_round_no_subactivity",
                condition=models.Q(subactivity__isnull=True),
            ),
        ]


class LqasAbsenceStats(LqasBaseModel):
    farm = models.IntegerField()
    other = models.IntegerField()
    market = models.IntegerField()
    school = models.IntegerField()
    travelled = models.IntegerField()
    in_playground = models.IntegerField()
    unknown = models.IntegerField()

    JSON_KEYS = {
        "farm": "Farm",
        "other": "Other",
        # "other": "Otherone", # This has been seen in the data
        "market": "Market",
        "school": "School",
        "travelled": "Travelled",
        "in_playground": "In_playground",
        "unknown": "unknown",
    }

    class Meta(LqasBaseModel.Meta):
        verbose_name = _("LQAS Absent Children Statistics")
        verbose_name_plural = _("LQAS Absent Children Statistics")
        constraints = [
            models.UniqueConstraint(
                fields=["round", "subactivity"],
                name="unique_lqasabsencestats_round_subactivity",
                condition=models.Q(subactivity__isnull=False),
            ),
            models.UniqueConstraint(
                fields=["round"],
                name="unique_lqasabsencestats_round_no_subactivity",
                condition=models.Q(subactivity__isnull=True),
            ),
        ]
