from django.db import models
from django.utils.translation import gettext_lazy as _
from semantic_version import Version
from semantic_version.django_fields import VersionField


class VersionModelQuerySet(models.QuerySet):
    def latest_by_version(self):
        return self.latest("-version_major", "-version_minor", "-version_patch")


class VersionModel(models.Model):
    version = VersionField(coerce=True, blank=False)

    # todo : we should use django GenericRelatedField when switching to django 5 there
    version_major = models.PositiveSmallIntegerField()
    version_minor = models.PositiveSmallIntegerField()
    version_patch = models.PositiveSmallIntegerField()

    class Meta:
        abstract = True
        indexes = [
            models.Index(fields=["-version_major", "-version_minor", "-version_patch"]),
        ]

    objects = models.Manager.from_queryset(VersionModelQuerySet)()

    def set_version_fields(self, version=None):
        version = version or self.version

        if not version:
            raise ValueError(_("Version cannot be empty"))

        v = Version(version)

        self.version_major = v.major
        self.version_minor = v.minor
        self.version_patch = v.patch

    def save(self, *args, **kwargs):
        self.set_version_fields()
        super().save(*args, **kwargs)
