from typing import Union

from django.contrib.auth.models import AnonymousUser, User
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext as _

from iaso.models import OrgUnit
from iaso.models.org_unit import OrgUnit


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


class LqasRoundData(models.Model):
    round = models.ForeignKey("Round", on_delete=models.CASCADE)
    subactivity = models.ForeignKey("SubActivity", on_delete=models.CASCADE, null=True, blank=True)
    lqas_failed = models.IntegerField()
    lqas_passed = models.IntegerField()
    lqas_no_data = models.IntegerField()
    status = models.CharField(max_length=20, choices=LqasStatuses.choices, default=LqasStatuses.INSCOPE)

    # no finger mark fields
    nfm_other = models.IntegerField()
    nfm_child_absent = models.IntegerField()
    nfm_non_compliance = models.IntegerField()
    nfm_child_was_asleep = models.IntegerField()
    nfm_house_not_visited = models.IntegerField()
    nfm_child_is_a_visitor = models.IntegerField()
    nfm_vaccinated_but_not_fm = models.IntegerField()

    # reason for absence fields
    abs_farm = models.IntegerField()
    abs_other = models.IntegerField()
    abs_market = models.IntegerField()
    abs_school = models.IntegerField()
    abs_travelled = models.IntegerField()
    abs_in_playground = models.IntegerField()
    abs_unknown = models.IntegerField()

    JSON_KEYS = {
        "lqas_failed": "lqas_failed",
        "lqas_passed": "lqas_passed",
        "lqas_no_data": "lqas_no_data",
        "status": "status",
    }

    NFM_JSON_KEYS = {
        "nfm_child_absent": "childabsent",
        "nfm_other": "Other",
        "nfm_non_compliance": "Non_Compliance",
        "nfm_child_was_asleep": "Child_was_asleep",
        "nfm_house_not_visited": "House_not_visited",
        "nfm_child_is_a_visitor": "Child_is_a_visitor",
        "nfm_vaccinated_but_not_fm": "Vaccinated_but_not_FM",
    }

    ABS_JSON_KEYS = {
        "abs_farm": "Farm",
        "abs_other": "Other",
        # "other": "Otherone", # This has been seen in the data
        "abs_market": "Market",
        "abs_school": "School",
        "abs_travelled": "Travelled",
        "abs_in_playground": "In_playground",
        "abs_unknown": "unknown",
    }

    class Meta:
        verbose_name = _("LQAS Round Data")
        verbose_name_plural = _("LQAS Round Data")
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


class LqasDistrictDataQuerySet(models.QuerySet):
    def filter_for_user(self, user: Union[User, AnonymousUser]):
        qs = self
        if user.is_authenticated:
            return qs.filter(round__campaign__account=user.iaso_profile.account)
        return qs.none()


class LqasDistrictData(models.Model):
    # Manager
    objects = models.Manager.from_queryset(LqasDistrictDataQuerySet)()

    round = models.ForeignKey("Round", on_delete=models.CASCADE)
    subactivity = models.ForeignKey("SubActivity", on_delete=models.CASCADE, null=True, blank=True)
    district = models.ForeignKey(OrgUnit, on_delete=models.CASCADE)
    total_children_fmd = models.IntegerField()
    total_children_checked = models.IntegerField()
    total_sites_visited = models.IntegerField()
    status = models.CharField(max_length=20, choices=LqasStatuses.choices, default=LqasStatuses.INSCOPE)

    # care giver stats
    cg_ratio = models.FloatField(blank=True, null=True)
    cg_best_info_source = models.CharField(blank=True)
    cg_best_info_ratio = models.FloatField(blank=True, null=True)
    cg_caregivers_informed = models.IntegerField(blank=True, null=True)
    cg_caregivers_informed_ratio = models.FloatField(blank=True, null=True)

    JSON_KEYS = {
        "total_children_fmd": "total_child_fmd",
        "total_children_checked": "total_child_checked",
        "total_sites_visited": "total_sites_visited",
        "status": "status",
        "care_giver_stats": "care_giver_stats",
    }
    CG_JSON_KEYS = {
        "cg_ratio": "ratio",
        "cg_caregivers_informed": "caregivers_informed",
        "cg_caregivers_informed_ratio": "caregivers_informed_ratio",
    }

    class Meta:
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
            models.Index(fields=["round"]),  # Help with round__lqas_ended_at filtering
        ]

    def __str__(self):
        if self.subactivity:
            return f"{self._meta.verbose_name} for {self.round} - {self.subactivity} - {self.district}"
        return f"{self._meta.verbose_name} for {self.round} - {self.district}"

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
