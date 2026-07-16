from django.contrib.auth import get_user_model
from django.contrib.auth.models import User
from django.db import models
from django.db.models import Case, Count, IntegerField, OuterRef, QuerySet, Subquery, Value, When
from django.utils.translation import gettext_lazy as _
from polymorphic.managers import PolymorphicManager
from polymorphic.models import PolymorphicModel

from iaso.models import Assignment
from iaso.models.common import CreatedAndUpdatedModel
from iaso.models.querysets import RelatedPolymorphicQuerySet
from iaso.utils.models.soft_deletable import SoftDeletableModel


class MissionType(models.TextChoices):
    FORM_FILLING = "FORM_FILLING", _("Form Filling")
    ORG_UNIT_AND_FORM = "ORG_UNIT_AND_FORM", _("Org Unit and Form")
    ENTITY_AND_FORM = "ENTITY_AND_FORM", _("Entity and Form")


class MissionQuerySet(RelatedPolymorphicQuerySet):
    def annotate_with_form_count(self):
        form_count_sq = (
            MissionFormThroughForm.objects.filter(mission_form_id=OuterRef("missionform__mission_ptr_id"))
            .values("mission_form_id")
            .annotate(c=Count("form_id"))
            .values("c")[:1]
        )

        out_count_sq = (
            MissionOrgUnitTypeThroughForm.objects.filter(
                mission_org_unit_type_id=OuterRef("missionorgunittype__mission_ptr_id")
            )
            .values("mission_org_unit_type_id")
            .annotate(c=Count("form_id"))
            .values("c")[:1]
        )

        et_count_sq = (
            MissionEntityTypeThroughForm.objects.filter(
                mission_entity_type_id=OuterRef("missionentitytype__mission_ptr_id")
            )
            .values("mission_entity_type_id")
            .annotate(c=Count("form_id"))
            .values("c")[:1]
        )
        return self.annotate(
            forms_count=Case(
                When(mission_type=MissionType.FORM_FILLING, then=Subquery(form_count_sq)),
                When(mission_type=MissionType.ORG_UNIT_AND_FORM, then=Subquery(out_count_sq)),
                When(mission_type=MissionType.ENTITY_AND_FORM, then=Subquery(et_count_sq)),
                output_field=IntegerField(),
                default=Value(0),
            )
        )

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
    MISSION_TYPE = None

    class Meta:
        ordering = ("name",)

    objects = MissionManager()

    name = models.CharField(max_length=200)
    description = models.CharField(max_length=500, blank=True)
    account = models.ForeignKey("Account", on_delete=models.CASCADE, related_name="missions")
    mission_type = models.CharField(max_length=30, choices=MissionType.choices)

    created_by = models.ForeignKey(get_user_model(), on_delete=models.SET_NULL, null=True, blank=True)

    def get_form_assignments(self, assignment: Assignment):
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


class MissionForm(Mission):
    """Contains the information for the FORM_FILLING mission type"""

    class Meta:
        ordering = ("id",)

    MISSION_TYPE = MissionType.FORM_FILLING

    forms = models.ManyToManyField("Form", related_name="mission_forms", through=MissionFormThroughForm)

    def get_form_assignments(self, assignment: Assignment) -> QuerySet[MissionFormThroughForm]:
        out_set = set(assignment.org_unit.org_unit_type.form_set.values_list("id", flat=True))
        return self.missionformthroughform_set.filter(form_id__in=list(out_set))


class MissionOrgUnitTypeThroughForm(models.Model):
    mission_org_unit_type = models.ForeignKey("MissionOrgUnitType", on_delete=models.CASCADE)
    form = models.ForeignKey("Form", on_delete=models.CASCADE)
    min_cardinality = models.PositiveIntegerField(
        default=1, help_text="Minimum number of times this form should be filled"
    )
    max_cardinality = models.PositiveIntegerField(
        null=True, blank=True, help_text="Maximum number of times this form can be filled (null = unlimited)"
    )

    class Meta:
        unique_together = (("mission_org_unit_type", "form"),)


class MissionOrgUnitType(Mission):
    """Contains the information for the ORG_UNIT_AND_FORM mission type"""

    class Meta:
        ordering = ("id",)

    MISSION_TYPE = MissionType.ORG_UNIT_AND_FORM

    org_unit_type = models.ForeignKey("OrgUnitType", on_delete=models.PROTECT, related_name="mission_org_unit_type")
    forms = models.ManyToManyField("Form", related_name="mission_org_unit_types", through=MissionOrgUnitTypeThroughForm)
    min_cardinality = models.PositiveIntegerField(
        default=1, help_text="Minimum number of times this form should be filled"
    )
    max_cardinality = models.PositiveIntegerField(
        null=True, blank=True, help_text="Maximum number of times this form can be filled (null = unlimited)"
    )

    def get_form_assignments(self, assignment: Assignment) -> bool:
        # We need to filter on OrgUnit which are parent of the type
        related_out = self.org_unit_type.id
        assignment_out = assignment.org_unit.org_unit_type.id

        return (
            related_out == assignment_out
            or related_out in assignment.org_unit.org_unit_type.sub_unit_types.values_list("id", flat=True)
        )


class MissionEntityTypeThroughForm(models.Model):
    mission_entity_type = models.ForeignKey("MissionEntityType", on_delete=models.CASCADE)
    form = models.ForeignKey("Form", on_delete=models.CASCADE)
    min_cardinality = models.PositiveIntegerField(
        default=1, help_text="Minimum number of times this form should be filled"
    )
    max_cardinality = models.PositiveIntegerField(
        null=True, blank=True, help_text="Maximum number of times this form can be filled (null = unlimited)"
    )

    class Meta:
        unique_together = (("mission_entity_type", "form"),)


class MissionEntityType(Mission):
    """Contains the information for the ENTITY_AND_FORM mission type"""

    class Meta:
        ordering = ("id",)

    MISSION_TYPE = MissionType.ENTITY_AND_FORM

    entity_type = models.ForeignKey("EntityType", on_delete=models.PROTECT, related_name="mission_entity_type")
    forms = models.ManyToManyField("Form", related_name="mission_entities", through=MissionEntityTypeThroughForm)
    min_cardinality = models.PositiveIntegerField(
        default=1, help_text="Minimum number of times this form should be filled"
    )
    max_cardinality = models.PositiveIntegerField(
        null=True, blank=True, help_text="Maximum number of times this form can be filled (null = unlimited)"
    )

    def get_form_assignments(self, assignment: Assignment) -> bool:
        # We always assign entities as there are no enforcement on entities and OrgUnit types.
        return True
