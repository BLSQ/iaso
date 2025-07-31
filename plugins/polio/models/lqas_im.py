from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext as _


class LqasBaseModel(models.Model):
    round = models.ForeignKey("Round", on_delete=models.CASCADE)
    subactivity = models.ForeignKey("SubActivity", on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        abstract = True
        unique_together = [("round", "subactivity")]

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
    district = models.ForeignKey("OrgUnit", on_delete=models.CASCADE)

    class Meta(LqasBaseModel.Meta):
        abstract = True
        unique_together = [("round", "subactivity", "district")]


class LqasActivityStats(LqasBaseModel):
    lqas_failed = models.IntegerField()
    lqas_passeded = models.IntegerField()
    lqas_no_data = models.IntegerField()

    class Meta(LqasBaseModel.Meta):
        verbose_name = _("LQAS Activity Statistics")
        verbose_name_plural = _("LQAS Activity Statistics")


class LqasEntry(LqasBaseModel):
    total_children_fmd = models.IntegerField()
    total_children_checked = models.IntegerField()
    total_sites_visited = models.IntegerField()

    class Meta(LqasBaseModel.Meta):
        verbose_name = _("LQAS Entry")
        verbose_name_plural = _("LQAS Entries")


class LqasCareGiverStats(models.Model):
    lqas_entry = models.ForeignKey("LqasEntry", on_delete=models.CASCADE, related_name="caregiver_stats")
    ratio = models.FloatField()
    best_info_source = models.CharField()
    caregivers_informed = models.IntegerField()
    caregivers_informed_ratio = models.FloatField()


class LqasNoMarkStats(LqasDistrictBaseModel):
    other = models.IntegerField()
    child_absent = models.IntegerField()
    non_compliance = models.IntegerField()
    child_was_asleep = models.IntegerField()
    house_not_visited = models.IntegerField()
    child_is_a_visitor = models.IntegerField()
    vaccinated_but_not_fm = models.IntegerField()

    class Meta(LqasDistrictBaseModel.Meta):
        verbose_name = _("LQAS No Finger Mark Statistics")
        verbose_name_plural = _("LQAS No Finger Mark Statistics")


class LqasAbsenceStats(LqasDistrictBaseModel):
    farm = models.IntegerField()
    other = models.IntegerField()
    market = models.IntegerField()
    school = models.IntegerField()
    travelled = models.IntegerField()
    in_playground = models.IntegerField()

    class Meta(LqasDistrictBaseModel.Meta):
        verbose_name = _("LQAS Absent Children Statistics")
        verbose_name_plural = _("LQAS Absent Children Statistics")
