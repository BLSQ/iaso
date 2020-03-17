from django.db import models
from django.utils.timezone import now


class Metric(models.Model):
    name = models.TextField()
    description = models.TextField(null=True)
    abbreviation = models.TextField(null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s - %s" % (self.abbreviation, self.name)


class DataPoint(models.Model):
    timestamp = models.DateTimeField(default=now)
    value = models.FloatField()
    metric = models.ForeignKey(Metric, on_delete=models.DO_NOTHING)

    class Meta:
        indexes = [
            models.Index(fields=["metric", "timestamp"]),
        ]

    def __str__(self):
        return "%s - %s" % (self.metric.abbreviation, self.timestamp)
