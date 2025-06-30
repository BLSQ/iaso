from django.db import models
from django.db.models import Case, When
from django.utils.translation import gettext_lazy as _

from .project import Project


class FeatureFlagQuerySet(models.QuerySet):
    category_order = [
        "DCO",
        "REO",
        "GEO",
        "DAV",
        "ENT",
        "PLA",
        "SPO",
        "NA",
    ]

    def order_by_category_then_order(self):
        category_ordering = Case(
            *[When(category=cat, then=pos) for pos, cat in enumerate(self.category_order)],
            output_field=models.IntegerField(),
        )
        return self.annotate(category_order=category_ordering).order_by("category_order", "order")


class FeatureFlag(models.Model):
    class FeatureFlagCategory(models.TextChoices):
        DATA_COLLECTION_OPTIONS = "DCO", _("Data collection options")
        REFRESH_OPTIONS = "REO", _("Refresh options")
        GEOGRAPHIC_OPTIONS = "GEO", _("Geographic options")
        DATA_VALIDATION = "DAV", _("Data Validation")
        ENTITIES = "ENT", _("Entities")
        PLANNING = "PLA", _("Planning")
        SPECIFIC_OPTIONS = "SPO", _("Specific options")
        NA = "NA", _("Not specified")

    INSTANT_EXPORT = "INSTANT_EXPORT"
    TAKE_GPS_ON_FORM = "TAKE_GPS_ON_FORM"
    REQUIRE_AUTHENTICATION = "REQUIRE_AUTHENTICATION"
    FORMS_AUTO_UPLOAD = "FORMS_AUTO_UPLOAD"
    LIMIT_OU_DOWNLOAD_TO_ROOTS = "LIMIT_OU_DOWNLOAD_TO_ROOTS"
    HOME_OFFLINE = "HOME_OFFLINE"

    FEATURE_FLAGS = {
        (INSTANT_EXPORT, "Instant export", _("Immediate export of instances to DHIS2")),
        (
            TAKE_GPS_ON_FORM,
            "Mobile: take GPS on new form",
            False,
            _("GPS localization on start of instance on mobile"),
        ),
        (
            REQUIRE_AUTHENTICATION,
            "Mobile: authentication required",
            _("Require authentication on mobile"),
        ),
        (
            LIMIT_OU_DOWNLOAD_TO_ROOTS,
            False,
            "Mobile: Limit download of orgunit to what the user has access to",
            _(
                "Mobile: Limit download of orgunit to what the user has access to",
            ),
        ),
        (
            FORMS_AUTO_UPLOAD,
            "",
            False,
            _(
                "Saving a form as finalized on mobile triggers an upload attempt immediately + everytime network becomes available"
            ),
        ),
    }

    code = models.CharField(max_length=100, null=False, blank=False, unique=True)
    name = models.CharField(max_length=100, null=False, blank=False)
    requires_authentication = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    category = models.TextField(choices=FeatureFlagCategory.choices, default=FeatureFlagCategory.NA)
    configuration_schema = models.JSONField(null=True, default=None)
    order = models.PositiveSmallIntegerField(default=0)
    is_dangerous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = FeatureFlagQuerySet.as_manager()

    def __str__(self):
        return self.name


class ProjectFeatureFlags(models.Model):
    featureflag = models.ForeignKey(FeatureFlag, on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    configuration = models.JSONField(null=True, default=None)

    class Meta:
        db_table = "iaso_project_feature_flags"
