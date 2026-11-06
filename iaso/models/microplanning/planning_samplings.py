from django.contrib.auth import get_user_model
from django.db import models


class PlanningSamplingResult(models.Model):
    """Stores the results of sampling runs."""

    planning = models.ForeignKey("Planning", on_delete=models.CASCADE, related_name="sampling_results")
    task = models.ForeignKey("Task", on_delete=models.SET_NULL, null=True, blank=True, related_name="sampling_results")
    pipeline_id = models.CharField(max_length=36, blank=True, help_text="OpenHexa pipeline UUID")
    pipeline_version = models.CharField(max_length=100, blank=True, help_text="Pipeline version identifier")
    pipeline_name = models.CharField(max_length=100, blank=True, help_text="Pipeline name")
    group = models.ForeignKey(
        "Group",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        help_text="Created org unit group containing sampled units",
    )
    parameters = models.JSONField(help_text="Sampling parameters used for this run")
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Sampling Result"
        verbose_name_plural = "Sampling Results"
