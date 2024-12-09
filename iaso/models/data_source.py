import logging
import typing

from django.contrib.auth.models import AnonymousUser, User
from django.contrib.postgres.fields import ArrayField
from django.db import models
from django.utils.translation import gettext_lazy as _

if typing.TYPE_CHECKING:
    from iaso.models import OrgUnit, OrgUnitType


logger = logging.getLogger(__name__)


class DataSource(models.Model):
    """DataSources allow linking multiple things imported from the same source (DHIS2, CSV, ...)"""

    name = models.CharField(max_length=255, unique=True)
    read_only = models.BooleanField(default=False)
    projects = models.ManyToManyField("Project", related_name="data_sources", blank=True)
    credentials = models.ForeignKey(
        "ExternalCredentials",
        on_delete=models.SET_NULL,
        related_name="data_sources",
        null=True,
        blank=True,
    )

    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    default_version = models.ForeignKey("SourceVersion", null=True, blank=True, on_delete=models.SET_NULL)
    tree_config_status_fields = ArrayField(
        models.CharField(max_length=30, blank=True, choices=[]),
        default=list,
        blank=True,
        help_text="List of statuses used for display configuration of the OrgUnit tree.",
    )
    public = models.BooleanField(default=False)

    def __str__(self):
        return "%s " % (self.name,)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # Override `__init__` to avoid a circular import.
        # This could be replaced by a callable in Django ≥ 5.
        # https://docs.djangoproject.com/en/5.0/releases/5.0/#more-options-for-declaring-field-choices
        from iaso.models import OrgUnit

        self._meta.get_field("tree_config_status_fields").base_field.choices = OrgUnit.VALIDATION_STATUS_CHOICES

    def clean(self, *args, **kwargs):
        super().clean()
        self.tree_config_status_fields = list(set(self.tree_config_status_fields))

    def as_dict(self):
        versions = SourceVersion.objects.filter(data_source_id=self.id)
        return {
            "name": self.name,
            "description": self.description,
            "id": self.id,
            "url": self.credentials.url if self.credentials else None,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "versions": [v.as_dict_without_data_source() for v in versions],
            "tree_config_status_fields": self.tree_config_status_fields,
        }

    def as_small_dict(self):
        return {
            "name": self.name,
            "description": self.description,
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "tree_config_status_fields": self.tree_config_status_fields,
        }

    def as_list(self):
        return {"name": self.name, "id": self.id}


class SourceVersionQuerySet(models.QuerySet):
    def filter_for_user(self, user: typing.Union[User, AnonymousUser, None]):
        queryset = self
        if user and user.is_anonymous:
            return self.none()

        if user and user.is_authenticated:
            queryset = queryset.filter(data_source__projects__account=user.iaso_profile.account).distinct()

        return queryset


SourceVersionManager = models.Manager.from_queryset(SourceVersionQuerySet)


class SourceVersion(models.Model):
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name="versions")
    number = models.IntegerField()
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = SourceVersionManager()

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["data_source", "number"], name="unique_number_data_source_version")
        ]

    def __str__(self):
        return "%s %d" % (self.data_source, self.number)

    def as_dict(self):
        return {
            "data_source": self.data_source.as_dict(),
            "number": self.number,
            "description": self.description,
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
        }

    def as_small_dict(self):
        return {
            "data_source": self.data_source.as_small_dict(),
            "number": self.number,
            "description": self.description,
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
        }

    def as_list(self):
        return {
            "data_source": self.data_source.as_list(),
            "number": self.number,
            "id": self.id,
        }

    def as_dict_without_data_source(self):
        return {
            "number": self.number,
            "description": self.description,
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "org_units_count": self.orgunit_set.count(),
        }

    def as_report_dict(self):
        report = {}
        report["org_units"] = self.orgunit_set.count()
        report["org_units_with_location"] = self.orgunit_set.exclude(location=None).count()
        report["org_units_with_shapes"] = self.orgunit_set.filter(simplified_geom__isnull=False).count()
        org_unit_types = self.orgunit_set.values_list("org_unit_type__name", "org_unit_type__id").distinct()
        org_unit_types_report = {}
        for t in org_unit_types:
            name, ident = t
            org_unit_types_report[name] = self.orgunit_set.filter(org_unit_type_id=ident).count()
        report["types"] = org_unit_types_report
        group_report = {}
        groups = self.orgunit_set.values_list("groups__name", "groups__id").distinct()
        for group in groups:
            name, ident = group
            group_report[name] = self.orgunit_set.filter(groups__id=ident).count()
        report["groups"] = group_report
        return report


class DataSourceSynchronization(models.Model):
    """
    This table allows to synchronize two pyramids by creating "change requests"
    based on their diff.

    The diff is stored in JSON and generated using the `diffing` module:

        diff = Differ().diff()
        json_diff = Dumper().as_json(diff)

    Basic business use case:

    - often, a pyramid of org units is created in DHIS2 and imported in IASO
    - IASO is then used to update the pyramid
    - but meanwhile, people may continue to make changes in DHIS2
    - as a consequence, the two pyramids diverge
    - so we need to synchronize the changes in the two pyramids
    """

    name = models.CharField(
        max_length=255,
        help_text=_("Used in the UI e.g. to filter Change Requests by Data Source Synchronization operations."),
    )
    source_version_to_update = models.ForeignKey(
        SourceVersion,
        on_delete=models.CASCADE,
        related_name="synchronized_as_source_version_to_update",
        help_text=_("The pyramid for which we want to generate change requests."),
    )
    source_version_to_compare_with = models.ForeignKey(
        SourceVersion,
        on_delete=models.CASCADE,
        related_name="synchronized_as_source_version_to_compare_with",
        help_text=_("The pyramid as a comparison."),
    )

    json_diff = models.JSONField(null=True, blank=True, help_text=_("The diff used to create change requests."))
    json_diff_config = models.TextField(
        blank=True, help_text=_("A string representing the parameters used for the diff.")
    )

    sync_task = models.OneToOneField(
        "Task",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        help_text=_("The background task that used the diff to create change requests."),
    )

    # Metadata.
    account = models.ForeignKey("Account", on_delete=models.CASCADE)
    created_by = models.ForeignKey(
        User, null=True, on_delete=models.SET_NULL, related_name="created_data_source_synchronizations"
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Data source synchronization")

    def __str__(self) -> str:
        return self.name

    def create_json_diff(
        self,
        logger_to_use: logging.Logger = None,
        source_version_to_update_validation_status: typing.Union[str, None] = None,
        source_version_to_update_top_org_unit: typing.Union[int, "OrgUnit", None] = None,
        source_version_to_update_org_unit_types: typing.Optional[set["OrgUnitType"]] = None,
        source_version_to_compare_with_validation_status: typing.Union[str, None] = None,
        source_version_to_compare_with_top_org_unit: typing.Union[int, "OrgUnit", None] = None,
        source_version_to_compare_with_org_unit_types: typing.Optional[set["OrgUnitType"]] = None,
        ignore_groups: typing.Optional[bool] = False,
        show_deleted_org_units: typing.Optional[bool] = False,
        field_names: typing.Optional[list[str]] = None,
    ) -> None:
        # Prevent a circular import.
        from iaso.diffing import Differ, Dumper

        differ_params = {
            # Actual version.
            "version": self.source_version_to_update,
            "validation_status": source_version_to_update_validation_status,
            "top_org_unit": source_version_to_update_top_org_unit,
            "org_unit_types": source_version_to_update_org_unit_types,
            # New version.
            "version_ref": self.source_version_to_compare_with,
            "validation_status_ref": source_version_to_compare_with_validation_status,
            "top_org_unit_ref": source_version_to_compare_with_top_org_unit,
            "org_unit_types_ref": source_version_to_compare_with_org_unit_types,
            # Options.
            "ignore_groups": ignore_groups,
            "show_deleted_org_units": show_deleted_org_units,
            "field_names": field_names,
        }

        diffs, fields = Differ(logger_to_use or logger).diff(**differ_params)

        self.json_diff = Dumper(logger_to_use).as_json(diffs)
        self.json_diff_config = str(differ_params)
        self.save(update_fields=["json_diff", "json_diff_config"])
