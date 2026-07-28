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


class MissionType(models.TextChoices):
    FORM_FILLING = "FORM_FILLING", _("Form Filling")
    ORG_UNIT_AND_FORM = "ORG_UNIT_AND_FORM", _("Org Unit and Form")
    ENTITY_AND_FORM = "ENTITY_AND_FORM", _("Entity and Form")


class MissionQuerySet(RelatedPolymorphicQuerySet):
    def annotate_with_form_count(self):
        return self.annotate(forms_count=Count("forms"))

    def filter_for_user(self, user: User):
        iaso_profile = getattr(user, "iaso_profile", None)
        account = getattr(iaso_profile, "account", None)
        if not account:
            return self.none()
        return self.filter(account=account)


class MissionManager(PolymorphicManager.from_queryset(MissionQuerySet)):
    def get_queryset(self):
        return super().get_queryset().filter(deleted_at__isnull=True)


class MissionForm(SoftDeletableModel, CreatedAndUpdatedModel, PolymorphicModel):
    class Meta:
        ordering = ("id",)

    MISSION_TYPE = MissionType.FORM_FILLING

    objects = MissionManager()

    name = models.CharField(max_length=200)
    description = models.CharField(max_length=500, blank=True)
    account = models.ForeignKey("Account", on_delete=models.CASCADE, related_name="missions")
    mission_type = models.CharField(max_length=30, choices=MissionType.choices)
    forms = models.ManyToManyField("Form", related_name="mission_forms", through="MissionFormThroughForm")

    created_by = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True, blank=True)

    def get_assignments(self):
        raise NotImplementedError

    def save(self, *args, **kwargs):
        self.mission_type = self.MISSION_TYPE
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class MissionFormThroughForm(models.Model):
    mission_form = models.ForeignKey("MissionForm", on_delete=models.CASCADE)
    form = models.ForeignKey("Form", on_delete=models.CASCADE)
    min_cardinality = models.PositiveIntegerField(
        default=1, help_text="Minimum number of times this form should be filled"
    )
    max_cardinality = models.PositiveIntegerField(
        null=True, blank=True, help_text="Maximum number of times this form can be filled (null = unlimited)"
    )

    class Meta:
        unique_together = (("mission_form", "form"),)


class MissionOrgUnitType(MissionForm):
    """Contains the information for the ORG_UNIT_AND_FORM mission type"""

    MISSION_TYPE = MissionType.ORG_UNIT_AND_FORM

    org_unit_type = models.ForeignKey("OrgUnitType", on_delete=models.PROTECT, related_name="mission_org_unit_type")
    min_cardinality = models.PositiveIntegerField(
        default=1, help_text="Minimum number of times this form should be filled"
    )
    max_cardinality = models.PositiveIntegerField(
        null=True, blank=True, help_text="Maximum number of times this form can be filled (null = unlimited)"
    )

    def get_assignments(self):
        raise NotImplementedError


class MissionEntityType(MissionForm):
    """Contains the information for the ENTITY_AND_FORM mission type"""

    MISSION_TYPE = MissionType.ENTITY_AND_FORM

    entity_type = models.ForeignKey("EntityType", on_delete=models.PROTECT, related_name="mission_entity_type")
    min_cardinality = models.PositiveIntegerField(
        default=1, help_text="Minimum number of times this form should be filled"
    )
    max_cardinality = models.PositiveIntegerField(
        null=True, blank=True, help_text="Maximum number of times this form can be filled (null = unlimited)"
    )

    def get_assignments(self):
        raise NotImplementedError
