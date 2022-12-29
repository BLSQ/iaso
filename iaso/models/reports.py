import uuid
from datetime import datetime
from django.db import models
from django.db.models import QuerySet
from django.utils import timezone

from iaso.models import Project
from iaso.utils.models.soft_deletable import SoftDeletableModel


class ReportVersion(SoftDeletableModel):
    PUBLISHED = [("published", "Published"), ("unpublished", "Unpublished")]

    file = models.FileField()
    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    status = models.CharField(choices=PUBLISHED, max_length=255, default="unpublished")

    def __str__(self):
        return f"{self.name}"


class Report(SoftDeletableModel):
    name = models.CharField(max_length=255)
    published_version = models.ForeignKey(ReportVersion, on_delete=models.PROTECT)
    project = models.ForeignKey(Project, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} {self.project}"
