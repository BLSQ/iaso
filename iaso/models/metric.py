from django.db import models

from iaso.models import OrgUnit


class MetricType(models.Model):
    class Meta:
        unique_together = [
            ["account", "name"],
            # ["account", "code"], TODO
        ]

    account = models.ForeignKey("iaso.Account", on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    source = models.CharField(max_length=255, blank=True)
    units = models.CharField(max_length=255, blank=True)
    unit_symbol = models.CharField(max_length=255, blank=True)
    category = models.CharField(max_length=255, blank=True)
    legend_threshold = models.JSONField(blank=True, default=dict)
    comments = models.TextField(blank=True)
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
    value = models.FloatField()

    def __str__(self):
        return "%s %s %s %s" % (self.metric_type, self.org_unit, self.year, self.value)
