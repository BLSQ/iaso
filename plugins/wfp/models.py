from django.db import models
from django.utils.translation import gettext_lazy as _

from wfp.models import *

GENDERS = [("MALE", _("Male")), ("FEMALE", _("Female"))]

EXIT_TYPES = [("DEATH", _("Death")), ("CURED", _("Cured")), ("DISMISSED_DUE_TO_CHEATING",_("Dismissal")), ("VOLUNTARY_WITH_DRAWAL",_("Voluntary Withdrawal"))]

NUTRITION_PROGRAMMES = [("TSFP", _("TSFP")), ("OTP", _("OTP"))]

PROGRAMME_TYPE = [("PLW", _("PLW")), ("U5", _("U5"))]

ADMISSION_CRITERIAS = [("MUAC", _("MUAC")), ("WHZ", _("WHZ")), ("OEDEMA", _("OEDEMA"))]

ADMISSION_TYPES = [
    ("NEW", _("new case")),
    ("NEW_RESPONDANT", _("New respondant")),
    ("NEW_RESPONDANT", _("New respondant")),
    ("REFERRED_FROM_OTP_SAM", _("Referred from OTP (SAM)")),
    ("REFERRED_FROM_SC", _("Referred from SC")),
    ("REFERRED_FROM_TSFP_MAM", _("Referred from TSFP (MAM)")),
    ("RELAPSED", _("Relapsed")),
    ("RETURNED_DEFAULTED", _("Returned defaulter")),
    ("TRANSFER_IF_FROM_OTHER_TSFP", _("Transfer if from other TSFP")),
]

#iaso copied (and simplified) models
#-----------------------------------

class OrgUnitType(models.Model):
    class Meta:
        managed = False
    """A type of org unit, such as a country, a province, a district, a health facility, etc.

    Note: they are scope at the account level: for a given name and depth, there can be only one OUT per account
    """

    CATEGORIES = [
        ("COUNTRY", _("Country")),
        ("REGION", _("Region")),
        ("DISTRICT", _("District")),
        ("HF", _("Health Facility")),
    ]
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    category = models.CharField(max_length=8, choices=CATEGORIES, null=True, blank=True)
    sub_unit_types = models.ManyToManyField("OrgUnitType", related_name="super_types", blank=True)
    # Allow the creation of these sub org unit types only for mobile (IA-2153)"
    allow_creating_sub_unit_types = models.ManyToManyField("OrgUnitType", related_name="create_types", blank=True)
    reference_form = models.ForeignKey("Form", on_delete=models.DO_NOTHING, null=True, blank=True)
    depth = models.PositiveSmallIntegerField(null=True, blank=True)


class OrgUnit(models.Model):
    class Meta:
        managed = False
        db_table = "iaso_orgunit"

    VALIDATION_NEW = "NEW"
    VALIDATION_VALID = "VALID"
    VALIDATION_REJECTED = "REJECTED"

    VALIDATION_STATUS_CHOICES = (
        (VALIDATION_NEW, _("new")),
        (VALIDATION_VALID, _("valid")),
        (VALIDATION_REJECTED, _("rejected")),
    )

    name = models.CharField(max_length=255)
    uuid = models.TextField(null=True, blank=True, db_index=True)
    custom = models.BooleanField(default=False)
    validated = models.BooleanField(default=True, db_index=True)  # TO DO : remove in a later migration
    validation_status = models.CharField(max_length=25, choices=VALIDATION_STATUS_CHOICES, default=VALIDATION_NEW)
    # The migration 0086_add_version_constraints add a constraint to ensure that the source version
    # is the same between the orgunit and the group
    parent = models.ForeignKey("OrgUnit", on_delete=models.CASCADE, null=True, blank=True)

    org_unit_type = models.ForeignKey(OrgUnitType, on_delete=models.CASCADE, null=True, blank=True)

    sub_source = models.TextField(null=True, blank=True)  # sometimes, in a given source, there are sub sources
    source_ref = models.TextField(null=True, blank=True, db_index=True)

    geom_ref = models.IntegerField(null=True, blank=True)
    reference_instance = models.ForeignKey("Instance", on_delete=models.DO_NOTHING, null=True, blank=True)

    gps_source = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Form(models.Model):
    """Metadata about a form

    Forms are versioned, see the FormVersion model
    """

    class Meta:
        managed = False
        db_table = "iaso_form"

    org_unit_types = models.ManyToManyField("OrgUnitType", blank=True)
    form_id = models.TextField(null=True, blank=True)  # extracted from version xls file
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.TextField()
    location_field = models.TextField(null=True, blank=True)
    correlation_field = models.TextField(null=True, blank=True)
    correlatable = models.BooleanField(default=False)
    # see update_possible_fields
    possible_fields = models.JSONField(
        null=True,
        blank=True,
        help_text="Questions present in all versions of the form, as a flat list."
        "Automatically updated on new versions.",
    )

    single_per_period = models.BooleanField(default=False)
    # The following two fields control the allowed period span (instances can be provided for the period corresponding
    # to [current_period - periods_before_allowed, current_period + periods_after_allowed]
    periods_before_allowed = models.IntegerField(default=0)
    periods_after_allowed = models.IntegerField(default=0)
    # True if the data is generated by iaso or  False via data entry in mobile
    derived = models.BooleanField(default=False)


class Instance(models.Model):

    class Meta:
        managed = False
        db_table = "iaso_instance"
    """A series of answers by an individual for a specific form

    Note that instances are called "Submissions" in the UI
    """

    UPLOADED_TO = "instances/"

    STATUS_READY = "READY"
    STATUS_DUPLICATED = "DUPLICATED"
    STATUS_EXPORTED = "EXPORTED"

    ALWAYS_ALLOWED_PATHS_XML = set(
        ["formhub", "formhub/uuid", "meta", "meta/instanceID", "meta/editUserID", "meta/deprecatedID"]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    uuid = models.TextField(null=True, blank=True)

    correlation_id = models.BigIntegerField(null=True, blank=True)
    name = models.TextField(null=True, blank=True)  # form.name
    file = models.FileField(upload_to=UPLOADED_TO, null=True, blank=True)
    file_name = models.TextField(null=True, blank=True)

    org_unit = models.ForeignKey("OrgUnit", on_delete=models.DO_NOTHING, null=True, blank=True)
    form = models.ForeignKey(
        "Form",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="instances",
    )

    json = models.JSONField(null=True, blank=True)
    accuracy = models.DecimalField(null=True, blank=True, decimal_places=2, max_digits=7)
    period = models.TextField(null=True, blank=True, db_index=True)
    entity = models.ForeignKey("Entity", null=True, blank=True, on_delete=models.DO_NOTHING, related_name="instances")

    last_export_success_at = models.DateTimeField(null=True, blank=True)

    # Is instance SoftDeleted. It doesn't use the SoftDeleteModel deleted_at like the rest for historical reason.
    deleted = models.BooleanField(default=False)
    # See public_create_url workflow in enketo/README.md. used to tell we should export immediately
    to_export = models.BooleanField(default=False)


class EntityType(models.Model):
    """Its `reference_form` describes the core attributes/metadata about the entity type (in case it refers to a person: name, age, ...)"""

    class Meta:
        managed = False
        db_table = "iaso_entitytype"
    name = models.CharField(max_length=255)  # Example: "Child under 5"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Link to the reference form that contains the core attribute/metadata specific to this entity type
    reference_form = models.ForeignKey(Form, blank=True, null=True, on_delete=models.PROTECT)

    is_active = models.BooleanField(default=False)
    # Fields (subset of the fields from the reference form) that will be shown in the UI - entity list view

    def __str__(self):
        return f"{self.name}"

    def as_dict(self):
        return {
            "name": self.name,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "reference_form": self.reference_form.as_dict(),
            "account": self.account.as_dict(),
        }


class Entity(models.Model):
    class Meta:
        managed = False
        verbose_name_plural = "Entities"
        db_table = "iaso_entity"

    """An entity represents a physical object or person with a known Entity Type

    Contrary to forms, they are not linked to a specific OrgUnit.
    The core attributes that define this entity are not stored as fields in the Entity model, but in an Instance /
    submission
    """

    name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    entity_type = models.ForeignKey(EntityType, blank=True, on_delete=models.PROTECT)
    attributes = models.OneToOneField(
        Instance, on_delete=models.PROTECT, help_text="instance", related_name="attributes", blank=True, null=True
    )

# WFP Models


class Beneficiary(models.Model):
    birth_date = models.DateField()
    gender = models.CharField(max_length=8, choices=GENDERS, null=True, blank=True)
    entity_id = models.IntegerField(null=True, blank=True)


class Journey(models.Model):
    beneficiary = models.ForeignKey(Beneficiary, on_delete=models.DO_NOTHING, null=True, blank=True)
    admission_criteria = models.CharField(max_length=255, choices=ADMISSION_CRITERIAS, null=True, blank=True)
    admission_type = models.CharField(max_length=255, choices=ADMISSION_TYPES, null=True, blank=True)
    nutrition_programme = models.CharField(max_length=255, choices=NUTRITION_PROGRAMMES, null=True, blank=True)
    programme_type = models.CharField(max_length=255, choices=PROGRAMME_TYPE, null=True, blank=True)
    weight_gain = models.FloatField(default=0)
    exit_type = models.CharField(max_length=50, choices=EXIT_TYPES, null=True, blank=True)
    instance_id = models.IntegerField(null=True, blank=True)


class Visit(models.Model):
    date = models.DateTimeField(null=True, blank=True)
    number = models.IntegerField(default=1)
    org_unit = models.ForeignKey(OrgUnit, on_delete=models.DO_NOTHING, null=True, blank=True)
    journey = models.ForeignKey(Journey, on_delete=models.DO_NOTHING, null=True, blank=True)
    instance_id = models.IntegerField(null=True, blank=True)


class Step(models.Model):
    assistance_type = models.CharField(max_length=255)
    quantity_given = models.FloatField()
    visit = models.ForeignKey(Visit, on_delete=models.DO_NOTHING, null=True, blank=True)
    instance_id = models.IntegerField(null=True, blank=True)


