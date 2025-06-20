import logging
import typing

from django.contrib.auth.models import AnonymousUser, User
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _


if typing.TYPE_CHECKING:
    from iaso.models import Group, OrgUnit, OrgUnitType

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
        return f"#{self.pk} {self.name}"

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
        return f"#{self.pk} n°{self.number} - Data source: {self.data_source}"

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


class DataSourceVersionsSynchronization(models.Model):
    """
    This table allows to synchronize two pyramids by creating "change requests"
    based on their diff.

    The logic is tightly coupled to the `iaso.diffing` module.

    Fields that can be synchronized:

        ["name", "parent", "opening_date", "closed_date", "groups"]

    Basic business use case:

    - often, a pyramid of org units is created in DHIS2 and imported in IASO
    - IASO is then used to update the pyramid
    - but meanwhile, people may continue to make changes in DHIS2
    - as a consequence, the two pyramids diverge
    - so we need to synchronize the changes in the two pyramids

    The synchronization is done in two steps:

    1. `self.create_json_diff()`
        - this will compute the diff between the two pyramids
        - the user will now how many change requests will be created
        - he still has the choice of giving up if there are too many differences
    2. `self.synchronize_source_versions()`
        - if the user is OK, this will synchronize the changes by creating change requests

    """

    SYNCHRONIZABLE_FIELDS = ["name", "parent", "opening_date", "closed_date"]
    # `groups` are synchronizable, but are handled via the `ignore_groups` param of the `Differ`.

    name = models.CharField(
        max_length=255,
        help_text=_("Used in the UI e.g. to filter Change Requests by Data Source Synchronization operations."),
    )
    source_version_to_update = models.ForeignKey(
        SourceVersion,
        on_delete=models.CASCADE,
        related_name="synchronized_as_source_version_to_update",
        help_text=_("The version of the pyramid for which we want to generate change requests."),
    )
    source_version_to_compare_with = models.ForeignKey(
        SourceVersion,
        on_delete=models.CASCADE,
        related_name="synchronized_as_source_version_to_compare_with",
        help_text=_("The version of the pyramid to use as a comparison."),
    )

    # The JSON format is defined in `iaso.diffing.synchronizer_serializers.DataSourceVersionsSynchronizerDiffSerializer`.
    json_diff = models.JSONField(null=True, blank=True, help_text=_("The diff used to create change requests."))
    diff_config = models.TextField(
        blank=True, help_text=_("A string representation of the parameters used for the diff.")
    )
    count_create = models.PositiveIntegerField(
        default=0, help_text=_("The number of change requests that will be generated to create an org unit.")
    )
    count_update = models.PositiveIntegerField(
        default=0, help_text=_("The number of change requests that will be generated to update an org unit.")
    )

    sync_task = models.OneToOneField(
        "Task",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
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

    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)

    def clean(self, *args, **kwargs):
        super().clean()
        self.clean_data_source_versions()

    def clean_data_source_versions(self) -> None:
        if self.source_version_to_update.data_source_id != self.source_version_to_compare_with.data_source_id:
            raise ValidationError("The two versions to compare must be linked to the same data source.")
        if self.source_version_to_update.pk == self.source_version_to_compare_with.pk:
            raise ValidationError("The two versions to compare must be different.")

    def create_json_diff(
        self,
        logger_to_use: logging.Logger = None,
        source_version_to_update_validation_status: str = None,
        source_version_to_update_top_org_unit: "OrgUnit" = None,
        source_version_to_update_org_unit_types: list["OrgUnitType"] = None,
        source_version_to_update_org_unit_group: "Group" = None,
        source_version_to_compare_with_validation_status: str = None,
        source_version_to_compare_with_top_org_unit: "OrgUnit" = None,
        source_version_to_compare_with_org_unit_types: list["OrgUnitType"] = None,
        source_version_to_compare_with_org_unit_group: "Group" = None,
        ignore_groups: bool = False,
        show_deleted_org_units: bool = False,
        field_names: list[str] = None,
    ) -> None:
        # Prevent a circular import.
        from iaso.diffing import Differ, diffs_to_json

        if self.change_requests.exists():
            raise ValidationError("Change requests have already been created.")

        differ_params = {
            # Version to update.
            "version": self.source_version_to_update,
            "validation_status": source_version_to_update_validation_status,
            "top_org_unit": source_version_to_update_top_org_unit,
            "org_unit_types": source_version_to_update_org_unit_types,
            "org_unit_group": source_version_to_update_org_unit_group,
            # Version to compare with.
            "version_ref": self.source_version_to_compare_with,
            "validation_status_ref": source_version_to_compare_with_validation_status,
            "top_org_unit_ref": source_version_to_compare_with_top_org_unit,
            "org_unit_types_ref": source_version_to_compare_with_org_unit_types,
            "org_unit_group_ref": source_version_to_compare_with_org_unit_group,
            # Options.
            "ignore_groups": ignore_groups,
            "show_deleted_org_units": show_deleted_org_units,
            "field_names": field_names,
        }
        diffs, _ = Differ(logger_to_use or logger).diff(**differ_params)

        # Reduce the size of the diff that will be stored in the DB.
        diffs = [diff for diff in diffs if diff.status != Differ.STATUS_SAME]

        count_status = {
            Differ.STATUS_NEW: 0,
            Differ.STATUS_MODIFIED: 0,
        }
        for diff in diffs:
            if diff.status in count_status:
                count_status[diff.status] += 1

        # Keep track of the parameters used for the diff.
        differ_config = {
            # Version to update.
            "version": self.source_version_to_update.pk,
            "validation_status": source_version_to_update_validation_status,
            "top_org_unit": source_version_to_update_top_org_unit.pk if source_version_to_update_top_org_unit else None,
            "org_unit_types": [out.pk for out in source_version_to_update_org_unit_types]
            if source_version_to_update_org_unit_types
            else None,
            "org_unit_group": source_version_to_update_org_unit_group.pk
            if source_version_to_update_org_unit_group
            else None,
            # Version to compare with.
            "version_ref": self.source_version_to_compare_with.pk,
            "validation_status_ref": source_version_to_compare_with_validation_status,
            "top_org_unit_ref": source_version_to_compare_with_top_org_unit.pk
            if source_version_to_compare_with_top_org_unit
            else None,
            "org_unit_types_ref": [out.pk for out in source_version_to_compare_with_org_unit_types]
            if source_version_to_compare_with_org_unit_types
            else None,
            "org_unit_group_ref": source_version_to_compare_with_org_unit_group.pk
            if source_version_to_compare_with_org_unit_group
            else None,
            # Options.
            "ignore_groups": ignore_groups,
            "show_deleted_org_units": show_deleted_org_units,
            "field_names": field_names,
        }

        self.count_create = count_status[Differ.STATUS_NEW]
        self.count_update = count_status[Differ.STATUS_MODIFIED]
        self.json_diff = diffs_to_json(diffs)
        self.diff_config = str(differ_config)
        self.save()

    def synchronize_source_versions(self):
        # Prevent a circular import.
        from iaso.diffing import DataSourceVersionsSynchronizer

        if self.json_diff is None:
            raise ValidationError("`create_json_diff()` must be called before synchronizing.")

        if self.change_requests.exists():
            raise ValidationError("Change requests have already been created.")

        synchronizer = DataSourceVersionsSynchronizer(data_source_sync=self)
        synchronizer.synchronize()
