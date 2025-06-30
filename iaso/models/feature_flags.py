from django.db import models
from django.utils.translation import gettext_lazy as _

from .project import Project


class FeatureFlag(models.Model):
    INSTANT_EXPORT = "INSTANT_EXPORT"
    TAKE_GPS_ON_FORM = "TAKE_GPS_ON_FORM"
    REQUIRE_AUTHENTICATION = "REQUIRE_AUTHENTICATION"
    LIMIT_OU_DOWNLOAD_TO_ROOTS = "LIMIT_OU_DOWNLOAD_TO_ROOTS"
    FORMS_AUTO_UPLOAD = "FORMS_AUTO_UPLOAD"

    FEATURE_FLAGS = {
        (
            INSTANT_EXPORT,
            False,
            "Instant export",
            _("Immediate export of instances to DHIS2"),
        ),
        (
            TAKE_GPS_ON_FORM,
            False,
            "Mobile: take GPS on new form",
            _("GPS localization on start of instance on mobile"),
        ),
        (
            REQUIRE_AUTHENTICATION,
            False,
            "Mobile: authentication required",
            _("Require authentication on mobile"),
        ),
        (
            LIMIT_OU_DOWNLOAD_TO_ROOTS,
            False,
            "Mobile: Limit download of orgunit to what the user has access to",
            _("Mobile: Limit download of orgunit to what the user has access to"),
        ),
        (
            FORMS_AUTO_UPLOAD,
            False,
            "",
            _(
                "Saving a form as finalized on mobile triggers an upload attempt immediately + everytime network becomes available"
            ),
        ),
    }

    code = models.CharField(max_length=100, null=False, blank=False, unique=True)
    name = models.CharField(max_length=100, null=False, blank=False)
    requires_authentication = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    configuration_schema = models.JSONField(null=True, default=None)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ProjectFeatureFlags(models.Model):
    featureflag = models.ForeignKey(FeatureFlag, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    configuration = models.JSONField(null=True, default=None)

    class Meta:
        db_table = "iaso_project_feature_flags"
