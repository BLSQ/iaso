from typing import TYPE_CHECKING

from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Count
from django.utils.translation import gettext_lazy as _
from polymorphic.managers import PolymorphicManager
from polymorphic.models import PolymorphicModel

from iaso.models.common import CreatedAndUpdatedModel
from iaso.models.querysets import RelatedPolymorphicQuerySet
from iaso.utils.models.soft_deletable import SoftDeletableModel


if TYPE_CHECKING:
    from iaso.models.org_unit import OrgUnit


class MissionType(models.TextChoices):
    FORM_FILLING = "FORM_FILLING", _("Form Filling")
    ORG_UNIT_AND_FORM = "ORG_UNIT_AND_FORM", _("Org Unit and Form")
    ENTITY_AND_FORM = "ENTITY_AND_FORM", _("Entity and Form")


class MissionQuerySet(RelatedPolymorphicQuerySet):
    def filter_for_user(self, user: User):
        iaso_profile = getattr(user, "iaso_profile", None)
        account = getattr(iaso_profile, "account", None)
        if not account:
            return self.none()
        return self.filter(account=account)


class MissionManager(PolymorphicManager.from_queryset(MissionQuerySet)):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class Mission(SoftDeletableModel, CreatedAndUpdatedModel, PolymorphicModel):
    class Meta:
        ordering = ("id",)

    MISSION_TYPE = None

    objects = MissionManager()

    name = models.CharField(max_length=200)
    description = models.CharField(max_length=500, blank=True)
    account = models.ForeignKey("Account", on_delete=models.CASCADE, related_name="missions")
    mission_type = models.CharField(max_length=30, choices=MissionType.choices)
    created_by = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True, blank=True)

    def get_form_assignments(self, org_unit: "OrgUnit"):
        raise NotImplementedError

    def save(self, *args, **kwargs):
        self.mission_type = self.MISSION_TYPE
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class MissionWithFormsQuerySet(RelatedPolymorphicQuerySet):
    def annotate_with_form_count(self):
        return self.annotate(forms_count=Count("forms"))

    def filter_for_user(self, user: User):
        iaso_profile = getattr(user, "iaso_profile", None)
        account = getattr(iaso_profile, "account", None)
        if not account:
            return self.none()
        return self.filter(account=account)


class MissionWithFormsManager(PolymorphicManager.from_queryset(MissionWithFormsQuerySet)):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class MissionWithForms(Mission):
    """
    Represents a mission that has forms as M2M to avoid duplication of table
    """

    forms = models.ManyToManyField("Form", related_name="mission_forms", through="MissionFormThroughForm")

    objects = MissionWithFormsManager()

    class Meta:
        ordering = ("id",)
        verbose_name_plural = "Missions with forms"
        verbose_name = "Mission with forms"


class MissionFormThroughForm(models.Model):
    mission_form = models.ForeignKey("MissionWithForms", on_delete=models.CASCADE)
    form = models.ForeignKey("Form", on_delete=models.CASCADE)
    min_cardinality = models.PositiveIntegerField(
        default=1, help_text="Minimum number of times this form should be filled"
    )
    max_cardinality = models.PositiveIntegerField(
        null=True, blank=True, help_text="Maximum number of times this form can be filled (null = unlimited)"
    )

    class Meta:
        unique_together = (("mission_form", "form"),)

    def get_form_assignments(self):
        raise NotImplementedError


class MissionForm(MissionWithForms):
    """Contains the information for the FORM_FILLING mission type"""

    class Meta:
        ordering = ("id",)

    MISSION_TYPE = MissionType.FORM_FILLING

    def get_form_assignments(self, org_unit: "OrgUnit") -> list[MissionFormThroughForm]:
        out_forms = {f.id for f in org_unit.org_unit_type.form_set.all()}

        return [tf for tf in self.missionformthroughform_set.all() if tf.form_id in out_forms]


class MissionOrgUnitType(MissionWithForms):
    """Contains the information for the ORG_UNIT_AND_FORM mission type"""

    MISSION_TYPE = MissionType.ORG_UNIT_AND_FORM

    org_unit_type = models.ForeignKey("OrgUnitType", on_delete=models.PROTECT, related_name="mission_org_unit_type")
    min_cardinality = models.PositiveIntegerField(
        default=1, help_text="Minimum number of times this form should be filled"
    )
    max_cardinality = models.PositiveIntegerField(
        null=True, blank=True, help_text="Maximum number of times this form can be filled (null = unlimited)"
    )

    def get_form_assignments(self, org_unit: "OrgUnit") -> bool:
        # We need to filter on OrgUnit which are parent of the type
        related_out = self.org_unit_type_id
        assignment_out = org_unit.org_unit_type_id

        sub_unit_type_ids = {t.id for t in org_unit.org_unit_type.sub_unit_types.all()}

        return related_out == assignment_out or related_out in sub_unit_type_ids


class MissionEntityType(MissionWithForms):
    """Contains the information for the ENTITY_AND_FORM mission type"""

    MISSION_TYPE = MissionType.ENTITY_AND_FORM

    entity_type = models.ForeignKey("EntityType", on_delete=models.PROTECT, related_name="mission_entity_type")
    min_cardinality = models.PositiveIntegerField(
        default=1, help_text="Minimum number of times this form should be filled"
    )
    max_cardinality = models.PositiveIntegerField(
        null=True, blank=True, help_text="Maximum number of times this form can be filled (null = unlimited)"
    )

    def get_form_assignments(self, org_unit: "OrgUnit") -> bool:
        # We always assign entities as there are no enforcement on entities and OrgUnit types.
        return True
