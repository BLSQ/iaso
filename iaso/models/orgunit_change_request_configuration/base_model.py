from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _

from iaso.models.orgunit_change_request_configuration.queryset import OrgUnitChangeRequestConfigurationQuerySet
from iaso.utils.models.soft_deletable import (
    SoftDeletableModel,
    DefaultSoftDeletableManager,
    OnlyDeletedSoftDeletableManager,
    IncludeDeletedSoftDeletableManager,
)


class OrgUnitChangeRequestConfiguration(SoftDeletableModel):
    """
    A configuration for OrgUnitChangeRequests of a specific OrgUnitType.

    This can prevent OrgUnits of that type from being modified, restrict which fields can be modified,
    or restrict the list of possible values for each field.
    """

    project = models.ForeignKey("Project", on_delete=models.PROTECT)
    org_unit_type = models.ForeignKey("OrgUnitType", on_delete=models.PROTECT)
    org_units_editable = models.BooleanField(default=True)  # = is it possible to edit org units of that type
    editable_fields = ArrayField(
        models.CharField(max_length=30, blank=True),
        default=list,
        blank=True,
        help_text="List of fields that can be edited in an OrgUnit",
    )
    possible_types = models.ManyToManyField(
        "OrgUnitType", related_name="org_unit_change_request_configurations_same_level", blank=True
    )
    possible_parent_types = models.ManyToManyField(
        "OrgUnitType", related_name="org_unit_change_request_configurations_parent_level", blank=True
    )
    group_sets = models.ManyToManyField("GroupSet", related_name="org_unit_change_request_configurations", blank=True)
    # The name below is not clear, but this attribute represents all the Forms for which a new reference instance can be submitted
    editable_reference_forms = models.ManyToManyField(
        "Form", related_name="org_unit_change_request_configurations", blank=True
    )
    other_groups = models.ManyToManyField("Group", related_name="org_unit_change_request_configurations", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="org_unit_change_request_configurations_created_set",
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="org_unit_change_request_configurations_updated_set",
    )

    # Managers
    objects = DefaultSoftDeletableManager.from_queryset(OrgUnitChangeRequestConfigurationQuerySet)()
    objects_only_deleted = OnlyDeletedSoftDeletableManager.from_queryset(OrgUnitChangeRequestConfigurationQuerySet)()
    objects_include_deleted = IncludeDeletedSoftDeletableManager.from_queryset(
        OrgUnitChangeRequestConfigurationQuerySet
    )()

    # Only the non-relationship fields since an ID present in any relationship
    # means that the field is editable by the user
    LIST_OF_POSSIBLE_EDITABLE_FIELDS = [
        "name",
        "aliases",
        "opening_date",
        "closed_date",
        "location",
    ]

    class Meta:
        verbose_name = _("Org unit change request configuration")
        indexes = [
            models.Index(fields=["project"]),
            models.Index(fields=["org_unit_type"]),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["project", "org_unit_type"],
                condition=Q(deleted_at__isnull=True),
                name="unique_project_org_unit_type_if_not_deleted",
            ),
        ]

    def __str__(self) -> str:
        return f"OUCRC ID #{self.id} - Project {self.project_id} - OrgUnit Type {self.org_unit_type_id}"

    def clean(self, *args, **kwargs):
        super().clean()
        self.editable_fields = list(set(self.editable_fields))
        self.clean_editable_fields()

    def clean_editable_fields(self) -> None:
        for name in self.editable_fields:
            if name not in self.LIST_OF_POSSIBLE_EDITABLE_FIELDS:
                raise ValidationError({"editable_fields": f"Value {name} is not a valid choice."})
