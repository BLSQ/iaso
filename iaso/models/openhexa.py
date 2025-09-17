from django.db import models

from iaso.utils.models.encrypted_text_field import EncryptedTextField
from iaso.utils.models.soft_deletable import SoftDeletableModel


class OpenHEXAInstance(models.Model):
    class Meta:
        verbose_name = "OpenHEXA Instance"
        verbose_name_plural = "OpenHEXA Instances"

    name = models.CharField(max_length=255, unique=True)
    url = models.URLField()
    token = EncryptedTextField()
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s %s" % (self.name, self.url)


class OpenHEXAWorkspace(SoftDeletableModel):
    class Meta:
        indexes = [
            models.Index(fields=["slug"]),
        ]
        unique_together = ("openhexa_instance", "account", "slug")
        verbose_name = "OpenHEXA Workspace"
        verbose_name_plural = "OpenHEXA Workspaces"

    openhexa_instance = models.ForeignKey(
        OpenHEXAInstance, on_delete=models.CASCADE, related_name="openhexa_workspaces"
    )
    account = models.ForeignKey("iaso.Account", on_delete=models.CASCADE)
    slug = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    config = models.JSONField(blank=True, default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s %s %s" % (self.openhexa_instance_id, self.account_id, self.slug)
