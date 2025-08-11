from django.db import models
from django.utils.translation import gettext_lazy as _

from iaso.models import OrgUnit


class MetricType(models.Model):
    class LegendType(models.TextChoices):
        THRESHOLD = "threshold", _("Threshold")
        LINEAR = "linear", _("Linear")
        ORDINAL = "ordinal", _("Ordinal")

    class Meta:
        ordering = ["id"]  # force ordering in order of creation (for demo)
        unique_together = [
            ["account", "code"],
        ]

    account = models.ForeignKey("iaso.Account", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    source = models.CharField(max_length=255, blank=True)
    units = models.CharField(max_length=255, blank=True)
    unit_symbol = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=255, blank=True)
    comments = models.TextField(blank=True)
    legend_type = models.CharField(
        choices=LegendType.choices,
        max_length=40,
        default=LegendType.THRESHOLD,
    )
    legend_config = models.JSONField(blank=True, default=dict)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s %s" % (self.name, self.id)


class MetricValue(models.Model):
    class Meta:
        unique_together = [["metric_type", "org_unit", "year"]]

    metric_type = models.ForeignKey(MetricType, on_delete=models.PROTECT)
    org_unit = models.ForeignKey(OrgUnit, null=True, blank=True, on_delete=models.PROTECT)
    year = models.IntegerField(null=True, blank=True)
    value = models.FloatField(null=True, blank=True)
    string_value = models.TextField(blank=True, default="")

    def __str__(self):
        return "%s %s %s %s" % (self.metric_type, self.org_unit, self.year, self.value)
