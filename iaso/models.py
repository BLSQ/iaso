import random
from urllib.request import urlopen
import pathlib
from django.db import models
from django.contrib.gis.db.models.fields import PointField, PolygonField
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField, CITextField, JSONField
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from django.utils.translation import ugettext_lazy as _
from iaso.utils import flat_parse_xml_file, slugify_underscore
from django.db.models import Q, Count
from operator import itemgetter

from iaso.odk import parsing


GEO_SOURCE_CHOICES = (
    ("snis", "SNIS"),
    ("ucla", "UCLA"),
    ("pnltha", "PNL THA"),
    ("derivated", "Derivated from actual data"),
)

YEAR = "YEAR"
QUARTER = "QUARTER"
MONTH = "MONTH"
SIX_MONTH = "SIX_MONTH"

PERIOD_TYPE_CHOICES = (
    (YEAR, _("Year")),
    (QUARTER, "Quarter"),
    (MONTH, "Month"),
    (SIX_MONTH, "Six-month"),
)

AGGREGATE = "AGGREGATE"
EVENT = "EVENT"
DERIVED = "DERIVED"

MAPPING_TYPE_CHOICES = (
    (AGGREGATE, _("Aggregate")),
    (EVENT, _("Event")),
    (DERIVED, _("Derived")),
)

QUEUED = "QUEUED"

STATUS_TYPE_CHOICES = (
    (QUEUED, _("Queued")),
    ("RUNNING", _("Running")),
    ("EXPORTED", _("Exported")),
    ("ERRORED", _("Errored")),
    ("SKIPPED", _("Skipped")),
)


def generate_id_for_dhis_2():
    letters = "abcdefghijklmnopqrstuvwxyz"
    letters = letters + letters.upper()
    all_chars = "0123456789" + letters
    first_letter = random.choice(letters)
    other_letters = random.choices(all_chars, k=10)
    return first_letter + "".join(other_letters)


class Account(models.Model):
    name = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    users = models.ManyToManyField(User, blank=True)
    default_version = models.ForeignKey(
        "SourceVersion", null=True, blank=True, on_delete=models.SET_NULL
    )

    def as_dict(self):
        return {
            "name": self.name,
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
        }

    def __str__(self):
        return "%s " % (self.name,)


class Project(models.Model):
    """A data collection project, associated with a single mobile application"""

    name = models.TextField(null=True, blank=True)
    forms = models.ManyToManyField("Form", blank=True, related_name="projects")
    account = models.ForeignKey(
        Account, on_delete=models.DO_NOTHING, null=True, blank=True
    )
    app_id = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s " % (self.name,)


class OrgUnitType(models.Model):
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sub_unit_types = models.ManyToManyField(
        "OrgUnitType", related_name="super_types", blank=True
    )

    projects = models.ManyToManyField(Project, related_name="unit_types", blank=True)
    depth = models.PositiveSmallIntegerField(null=True, blank=True)

    def __str__(self):
        return "%s" % (self.name)

    def as_dict(self, sub_units=True, app_id=None):
        res = {
            "id": self.id,
            "name": self.name,
            "short_name": self.short_name,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
        }
        if sub_units:
            if not app_id:
                sub_unit_types = [
                    unit.as_dict(sub_units=False) for unit in self.sub_unit_types.all()
                ]
            else:
                sub_unit_types = [
                    unit.as_dict(sub_units=False)
                    for unit in self.sub_unit_types.filter(projects__app_id=app_id)
                ]
            res["sub_unit_types"] = sub_unit_types
        return res


class DataSource(models.Model):
    name = models.CharField(max_length=255, unique=True)
    read_only = models.BooleanField(default=True)
    projects = models.ManyToManyField(Project, related_name="data_sources", blank=True)
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

    def __str__(self):
        return "%s " % (self.name,)

    def as_dict(self):
        versions = SourceVersion.objects.filter(data_source_id=self.id)
        return {
            "name": self.name,
            "description": self.description,
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "versions": [v.as_dict_without_data_source() for v in versions],
        }

    def as_list(self):
        return {"name": self.name, "id": self.id}


class SourceVersion(models.Model):
    data_source = models.ForeignKey(
        DataSource, on_delete=models.CASCADE, related_name="versions"
    )
    number = models.IntegerField()
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

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
        }

    def as_report_dict(self):
        report = {}
        report["org_units"] = self.orgunit_set.count()
        report["org_units_with_location"] = self.orgunit_set.exclude(
            location=None
        ).count()
        report["org_units_with_shapes"] = self.orgunit_set.filter(
            simplified_geom__isnull=False
        ).count()
        org_unit_types = self.orgunit_set.values_list(
            "org_unit_type__name", "org_unit_type__id"
        ).distinct()
        org_unit_types_report = {}
        for t in org_unit_types:
            name, ident = t
            org_unit_types_report[name] = self.orgunit_set.filter(
                org_unit_type_id=ident
            ).count()
        report["types"] = org_unit_types_report
        group_report = {}
        groups = self.orgunit_set.values_list("groups__name", "groups__id").distinct()
        for group in groups:
            name, ident = group
            group_report[name] = self.orgunit_set.filter(groups__id=ident).count()
        report["groups"] = group_report
        return report


class OrgUnit(models.Model):
    name = models.CharField(max_length=255)
    uuid = models.TextField(null=True, blank=True, db_index=True)
    custom = models.BooleanField(default=False)
    validated = models.BooleanField(default=True, db_index=True)
    version = models.ForeignKey(
        SourceVersion, null=True, blank=True, on_delete=models.CASCADE
    )
    parent = models.ForeignKey(
        "OrgUnit", on_delete=models.CASCADE, null=True, blank=True
    )
    aliases = ArrayField(
        CITextField(max_length=255, blank=True), size=100, null=True, blank=True
    )

    org_unit_type = models.ForeignKey(
        OrgUnitType, on_delete=models.CASCADE, null=True, blank=True
    )

    sub_source = models.TextField(
        choices=GEO_SOURCE_CHOICES, null=True, blank=True
    )  # sometimes, in a given source, there are sub sources
    source_ref = models.TextField(null=True, blank=True, db_index=True)
    geom = PolygonField(srid=4326, null=True, blank=True)
    simplified_geom = PolygonField(srid=4326, null=True, blank=True)
    catchment = PolygonField(srid=4326, null=True, blank=True)
    geom_source = models.TextField(choices=GEO_SOURCE_CHOICES, null=True, blank=True)
    geom_ref = models.IntegerField(null=True, blank=True)

    latitude = models.DecimalField(
        max_digits=10, decimal_places=8, null=True, blank=True
    )
    longitude = models.DecimalField(
        max_digits=11, decimal_places=8, null=True, blank=True
    )
    gps_source = models.TextField(
        null=True, blank=True
    )  # much more diverse than above GEO_SOURCE_CHOICES
    location = PointField(srid=4326, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s %s %d" % (self.org_unit_type, self.name, self.id)

    def as_dict_for_mobile(self):
        return {
            "name": self.name,
            "id": self.id,
            "parent_id": self.parent_id,
            "org_unit_type_id": self.org_unit_type_id,
            "org_unit_type_name": self.org_unit_type.name
            if self.org_unit_type
            else None,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "latitude": self.location.y if self.location else self.latitude,
            "longitude": self.location.x if self.location else self.longitude,
        }

    def as_dict(self, with_groups=True):
        res = {
            "name": self.name,
            "short_name": self.name,
            "id": self.id,
            "source": self.version.data_source.name if self.version else None,
            "source_ref": self.source_ref,
            "parent_id": self.parent_id,
            "org_unit_type_id": self.org_unit_type_id,
            "org_unit_type_name": self.org_unit_type.name
            if self.org_unit_type
            else None,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "aliases": self.aliases,
            "status": False if self.validated is None else self.validated,
            "latitude": self.location.y if self.location else self.latitude,
            "longitude": self.location.x if self.location else self.longitude,
            "has_geo_json": True if self.simplified_geom else False,
            "version": self.version.number if self.version else None,
        }

        if with_groups:
            res["groups"] = [group.as_dict() for group in self.groups.all()]

        if hasattr(self, "search_index"):
            res["search_index"] = self.search_index
        return res

    def as_dict_with_parents(self):
        return {
            "name": self.name,
            "short_name": self.name,
            "id": self.id,
            "source": self.version.data_source.name if self.version else None,
            "source_id": self.version.data_source.id if self.version else None,
            "sub_source": self.sub_source,
            "sub_source_id": self.sub_source,
            "source_ref": self.source_ref,
            "parent_id": self.parent_id,
            "parent_name": self.parent.name if self.parent else None,
            "parent": self.parent.as_dict_with_parents() if self.parent else None,
            "org_unit_type_id": self.org_unit_type_id,
            "org_unit_type_name": self.org_unit_type.name
            if self.org_unit_type
            else None,
            "org_unit_type": self.org_unit_type.as_dict()
            if self.org_unit_type
            else None,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "aliases": self.aliases,
            "status": False if self.validated is None else self.validated,
            "latitude": self.location.y if self.location else self.latitude,
            "longitude": self.location.x if self.location else self.longitude,
            "has_geo_json": True if self.simplified_geom else False,
            "version": self.version.number if self.version else None,
            "groups": [group.as_dict() for group in self.groups.all()],
        }

    def as_dict_for_csv(self):
        return {
            "name": self.name,
            "id": self.id,
            "source_ref": self.source_ref,
            "parent_id": self.parent_id,
            "org_unit_type": self.org_unit_type.name,
        }

    def as_location(self):
        res = {
            "id": self.id,
            "name": self.name,
            "short_name": self.name,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "has_geo_json": True if self.simplified_geom else False,
            "org_unit_type": self.org_unit_type.name if self.org_unit_type else None,
            "source_id": self.version.data_source.id if self.version else None,
            "source_name": self.version.data_source.name if self.version else None,
        }
        if hasattr(self, "search_index"):
            res["search_index"] = self.search_index
        return res

    def path(self):
        path_components = []
        cur = self
        while cur:
            if cur.source_ref:
                path_components.insert(0, cur.source_ref)
            cur = cur.parent
        if len(path_components) > 0:
            return "/" + ("/".join(path_components))
        return None


class RecordType(models.Model):
    projects = models.ManyToManyField(Project, related_name="record_types", blank=True)
    name = models.TextField()
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class Record(models.Model):
    value = models.DecimalField(max_digits=19, decimal_places=10)
    version = models.ForeignKey(
        SourceVersion, null=True, blank=True, on_delete=models.CASCADE
    )
    org_unit = models.ForeignKey(
        OrgUnit, null=True, blank=True, on_delete=models.CASCADE
    )
    record_type = models.ForeignKey(
        RecordType, on_delete=models.CASCADE, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)


class MatchingAlgorithm(models.Model):
    name = models.TextField()
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "%s - %s %s" % (
            self.name,
            self.description,
            self.created_at.timestamp() if self.created_at else None,
        )

    def as_dict(self):
        return {"name": self.name, "id": self.id, "description": self.description}


class AlgorithmRun(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    algorithm = models.ForeignKey(MatchingAlgorithm, on_delete=models.CASCADE)
    launcher = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    result = JSONField(null=True, blank=True)
    finished = models.BooleanField(default=False)
    version_1 = models.ForeignKey(
        SourceVersion,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="runs_where_destination",
    )
    version_2 = models.ForeignKey(
        SourceVersion,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="runs_where_source",
    )

    def __str__(self):
        return "%s - %s - %s" % (self.algorithm, self.created_at, self.launcher)

    def as_dict(self):
        links_count = Link.objects.filter(algorithm_run=self.id).count()
        return {
            "algorithm": self.algorithm.as_dict(),
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "ended_at": self.ended_at.timestamp() if self.ended_at else None,
            "result": self.result,
            "finished": self.finished,
            "launcher": self.launcher.profile.as_dict()
            if self.launcher and self.launcher.profile
            else None,
            "version_1": self.version_1.as_dict() if self.version_1 else None,
            "version_2": self.version_2.as_dict() if self.version_2 else None,
            "links_count": links_count,
        }

    def as_list(self):
        return {
            "algorithm_name": self.algorithm.name,
            "algorithm_id": self.algorithm.id,
            "id": self.id,
            "version_1": self.version_1.as_list() if self.version_1 else None,
            "version_2": self.version_2.as_list() if self.version_2 else None,
        }


class Link(models.Model):
    destination = models.ForeignKey(
        OrgUnit,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="source_set",
    )
    source = models.ForeignKey(
        OrgUnit,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="destination_set",
    )
    validated = models.BooleanField(default=False)
    validator = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    validation_date = models.DateTimeField(auto_now=True, null=True, blank=True)

    similarity_score = models.SmallIntegerField(null=True)
    algorithm_run = models.ForeignKey(
        AlgorithmRun, on_delete=models.CASCADE, null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s - %s - %s -%d" % (
            self.destination,
            self.source,
            self.algorithm_run,
            self.similarity_score,
        )

    def as_dict(self):
        return {
            "destination": self.destination.as_dict_with_parents(),
            "source": self.source.as_dict(),
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "validated": self.validated,
            "validator": self.validator.profile.as_dict()
            if self.validator and self.validator.profile
            else None,
            "validation_date": self.validation_date,
            "similarity_score": self.similarity_score,
            "algorithm_run": self.algorithm_run.as_dict()
            if self.algorithm_run
            else None,
        }

    def as_full_dict(self):
        return {
            "destination": self.destination.as_dict_with_parents(),
            "source": self.source.as_dict_with_parents(),
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "validated": self.validated,
            "validator": self.validator.profile.as_dict()
            if self.validator and self.validator.profile
            else None,
            "validation_date": self.validation_date,
            "similarity_score": self.similarity_score,
            "algorithm_run": self.algorithm_run.as_dict()
            if self.algorithm_run
            else None,
        }


class Form(models.Model):
    org_unit_types = models.ManyToManyField(OrgUnitType, blank=True)
    form_id = models.TextField(null=True, blank=True)  # extracted from version xls file
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.TextField()
    device_field = models.TextField(null=True, blank=True)
    location_field = models.TextField(null=True, blank=True)
    correlation_field = models.TextField(null=True, blank=True)
    correlatable = models.BooleanField(default=False)
    # Accumulated list of all the fields that were present at some point in a version of the form. This is used to
    # build a table view of the form answers without having to parse the xml files
    fields = JSONField(null=True, blank=True)
    period_type = models.TextField(null=True, blank=True, choices=PERIOD_TYPE_CHOICES)
    single_per_period = models.BooleanField(default=False)
    # The following two fields control the allowed period span (instances can be provided for the period corresponding
    # to [current_period - periods_before_allowed, current_period + periods_after_allowed]
    periods_before_allowed = models.IntegerField(default=3)
    periods_after_allowed = models.IntegerField(default=3)
    # True if the data is generated by iaso or  False via data entry in mobile
    derived = models.BooleanField(default=False)

    @property
    def latest_version(self):
        return self.form_versions.order_by("-created_at").first()

    def __str__(self):
        return "%s %s " % (self.name, self.form_id)

    def as_dict(self, additional_fields=None, show_version=True):
        res = {
            "form_id": self.form_id,
            "name": self.name,
            "id": self.id,
            "org_unit_types": [t.as_dict() for t in self.org_unit_types.all()],
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "period_type": self.period_type,
            "single_per_period": self.single_per_period,
        }

        if show_version:
            res["latest_form_version"] = (
                self.latest_version.as_dict()
                if self.latest_version is not None
                else None
            )
        if additional_fields:
            for field in additional_fields:
                if hasattr(self, field):
                    res[field] = getattr(self, field)

        return res


class Group(models.Model):
    name = models.TextField()
    source_ref = models.TextField(null=True, blank=True)
    source_version = models.ForeignKey(
        SourceVersion, null=True, blank=True, on_delete=models.CASCADE
    )
    org_units = models.ManyToManyField(OrgUnit, blank=True, related_name="groups")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s | %s " % (self.name, self.source_version)

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "source_ref": self.source_ref,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "source_version": self.source_version_id,
            "org_unit_count": self.org_units.count(),
        }


class GroupSet(models.Model):
    name = models.TextField()
    source_ref = models.TextField(null=True, blank=True)
    source_version = models.ForeignKey(
        SourceVersion, null=True, blank=True, on_delete=models.CASCADE
    )
    projects = models.ManyToManyField(Project, related_name="group_sets", blank=True)
    groups = models.ManyToManyField(Group, blank=True, related_name="group_sets")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s | %s " % (self.name, self.source_version)


def _form_version_upload_to(instance: "FormVersion", filename: str) -> str:
    path = pathlib.Path(filename)
    underscored_form_name = slugify_underscore(instance.form.name)

    return f"forms/{underscored_form_name}_{instance.version_id}{path.suffix}"


class FormVersion(models.Model):
    form = models.ForeignKey(
        Form, on_delete=models.CASCADE, related_name="form_versions"
    )
    # xml file representation
    file = models.FileField(upload_to=_form_version_upload_to)
    xls_file = models.FileField(
        upload_to=_form_version_upload_to, null=True, blank=True
    )
    form_descriptor = JSONField(null=True, blank=True)
    version_id = models.TextField()  # extracted from xls
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s - %s - %s" % (self.form.name, self.version_id, self.created_at)

    def get_or_save_form_descriptor(self):
        if self.form_descriptor:
            json_survey = self.form_descriptor
        elif self.xls_file:
            json_survey = parsing.to_json_dict(self)
            self.form_descriptor = json_survey
            self.save()
        else:
            json_survey = {}
        return json_survey

    def questions_by_name(self):
        return parsing.to_questions_by_name(self.get_or_save_form_descriptor())

    def as_dict(self):
        return {
            "id": self.id,
            "version_id": self.version_id,
            "file": self.file.url,
            "xls_file": self.xls_file.url if self.xls_file else None,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
        }


class Mapping(models.Model):
    name = models.TextField()
    data_source = models.ForeignKey(
        DataSource, on_delete=models.CASCADE, related_name="mappings"
    )
    form = models.ForeignKey(Form, on_delete=models.DO_NOTHING, null=True, blank=True)
    mapping_type = models.TextField(choices=MAPPING_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s %s" % (self.form, self.mapping_type)

    def is_aggregate(self):
        return self.mapping_type == AGGREGATE

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "data_source": self.data_source.as_dict(),
            "form": self.form.as_dict(),
            "mapping_type": self.mapping_type,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
        }


class MappingVersion(models.Model):
    QUESTION_MAPPING_NEVER_MAPPED = "neverMapped"
    QUESTION_MAPPING_MULTIPLE = "multiple"

    form_version = models.ForeignKey(
        FormVersion, on_delete=models.CASCADE, related_name="mapping_versions"
    )
    mapping = models.ForeignKey(
        Mapping,
        on_delete=models.CASCADE,
        related_name="versions",
        null=True,
        blank=True,
    )
    name = models.TextField()
    json = JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["form_version", "name"]]

    def __str__(self):
        return "%s - %s" % (self.form_version, self.name)


class ExternalCredentials(models.Model):
    account = models.ForeignKey(
        Account, on_delete=models.CASCADE, related_name="credentials"
    )

    name = models.TextField()
    login = models.TextField()
    password = models.TextField()
    url = models.TextField()

    def __str__(self):
        return "%s - %s - %s (%s)" % (self.name, self.login, self.url, self.account)


class InstanceQuerySet(models.QuerySet):
    def with_status(self):
        duplicates_subquery = (
            self.values("period", "form", "org_unit")
            .annotate(ids=ArrayAgg("id"))
            .annotate(c=models.Func("ids", models.Value(1), function="array_length"))
            .filter(form__in=Form.objects.filter(single_per_period=True))
            .filter(c__gt=1)
            .annotate(id=models.Func("ids", function="unnest"))
            .values("id")
        )

        return self.annotate(
            status=models.Case(
                models.When(
                    id__in=duplicates_subquery,
                    then=models.Value(Instance.STATUS_DUPLICATED),
                ),
                models.When(
                    last_export_success_at__isnull=False,
                    then=models.Value(Instance.STATUS_EXPORTED),
                ),
                default=models.Value(Instance.STATUS_READY),
                output_field=models.CharField(),
            )
        )

    def with_status_alternate(self):  # TODO: probably not needed
        duplicates_subquery = (
            self.exclude(id=models.OuterRef("id"))
            .filter(
                form_id=models.OuterRef("form_id"),
                org_unit_id=models.OuterRef("org_unit_id"),
                period=models.OuterRef("period"),
            )
            .values("form_id", "org_unit_id", "period")
            .annotate(duplicates_count=models.Count("*"))
        )

        qs = self.annotate(
            duplicates_count=models.Subquery(
                duplicates_subquery.values("duplicates_count"),
                output_field=models.IntegerField(),
            )
        )

        return qs.annotate(
            status=models.Case(
                models.When(
                    duplicates_count__gt=0,
                    then=models.Value(Instance.STATUS_DUPLICATED),
                ),
                models.When(
                    last_export_success_at__isnull=False,
                    then=models.Value(Instance.STATUS_EXPORTED),
                ),
                default=models.Value(Instance.STATUS_READY),
                output_field=models.CharField(),
            )
        )

    def counts_by_status(self):
        grouping_fields = ["period", "form_id", "form__name", "form__form_id"]

        return (
            self.values(*grouping_fields)
            .annotate(total_count=models.Count("id", distinct=True))
            .annotate(
                duplicated_count=models.Count(
                    "id",
                    distinct=True,
                    filter=models.Q(status=Instance.STATUS_DUPLICATED),
                )
            )
            .annotate(
                exported_count=models.Count(
                    "id",
                    distinct=True,
                    filter=models.Q(status=Instance.STATUS_EXPORTED),
                )
            )
            .annotate(
                ready_count=models.Count(
                    "id", distinct=True, filter=models.Q(status=Instance.STATUS_READY)
                )
            )
            .exclude(period=None)
            .order_by("period", "form__name")
        )

    def for_filters(
        self,
        form_id=None,
        form_ids=None,
        with_location=None,
        org_unit_type_id=None,
        device_id=None,
        device_ownership_id=None,
        org_unit_parent_id=None,
        org_unit_id=None,
        period_ids=None,
        status=None,
    ):
        queryset = self
        if period_ids:
            queryset = queryset.filter(period__in=period_ids.split(","))

        if org_unit_type_id:
            queryset = queryset.filter(
                org_unit__org_unit_type__in=org_unit_type_id.split(",")
            )
        if org_unit_id:
            queryset = queryset.filter(org_unit_id=org_unit_id)

        if org_unit_parent_id:
            queryset = queryset.filter(
                Q(org_unit__id=org_unit_parent_id)
                | Q(org_unit__parent__id=org_unit_parent_id)
                | Q(org_unit__parent__parent__id=org_unit_parent_id)
                | Q(org_unit__parent__parent__parent__id=org_unit_parent_id)
                | Q(org_unit__parent__parent__parent__parent__id=org_unit_parent_id)
                | Q(
                    org_unit__parent__parent__parent__parent__parent__id=org_unit_parent_id
                )
                | Q(
                    org_unit__parent__parent__parent__parent__parent__parent__id=org_unit_parent_id
                )
                | Q(
                    org_unit__parent__parent__parent__parent__parent__parent__parent__id=org_unit_parent_id
                )
            )

        if with_location == "true":
            queryset = queryset.filter(location__isnull=False)

        if with_location == "false":
            queryset = queryset.filter(location__isnull=True)

        if device_id:
            queryset = queryset.filter(device__id=device_id)

        if device_ownership_id:
            device_ownership = get_object_or_404(
                DeviceOwnership, pk=device_ownership_id
            )
            queryset = queryset.filter(device__id=device_ownership.device.id)

        if form_id:
            queryset = queryset.filter(form_id=form_id)

        if form_ids:
            queryset = queryset.filter(form_id__in=form_ids.split(","))
        # add status annotation
        queryset = queryset.with_status()

        if status:
            statuses = status.split(",")
            queryset = queryset.filter(status__in=statuses)

        return queryset


class Instance(models.Model):
    """A series of answers by an individual for a specific form"""

    UPLOADED_TO = "instances/"

    STATUS_READY = "READY"
    STATUS_DUPLICATED = "DUPLICATED"
    STATUS_EXPORTED = "EXPORTED"

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    uuid = models.TextField(null=True, blank=True)
    export_id = models.TextField(null=True, blank=True, default=generate_id_for_dhis_2)
    correlation_id = models.BigIntegerField(null=True, blank=True)
    name = models.TextField(null=True, blank=True)
    file = models.FileField(upload_to=UPLOADED_TO, null=True, blank=True)
    file_name = models.TextField(null=True, blank=True)
    location = PointField(srid=4326, null=True, blank=True)
    org_unit = models.ForeignKey(
        OrgUnit, on_delete=models.DO_NOTHING, null=True, blank=True
    )
    form = models.ForeignKey(
        Form, on_delete=models.PROTECT, null=True, blank=True, related_name="instances"
    )
    project = models.ForeignKey(
        Project, blank=True, null=True, on_delete=models.DO_NOTHING
    )
    json = JSONField(null=True, blank=True)
    accuracy = models.DecimalField(null=True, decimal_places=2, max_digits=7)
    device = models.ForeignKey(
        "Device", null=True, blank=True, on_delete=models.DO_NOTHING
    )
    period = models.TextField(null=True, blank=True, db_index=True)

    last_export_success_at = models.DateTimeField(null=True, blank=True)

    objects = InstanceQuerySet.as_manager()

    deleted = models.BooleanField(default=False)

    def convert_location_from_field(self, field_name=None):
        f = field_name
        if f is None:
            f = self.form.location_field

        if self.json and f:
            location = self.json.get(f, None)
            if location:
                latitude, longitude, altitude, accuracy = [
                    float(x) for x in location.split(" ")
                ]
                self.location = Point(x=longitude, y=latitude, srid=4326)
                self.accuracy = accuracy
                self.save()

    def convert_device(self):
        if self.json and not self.device:
            device_field = self.form.device_field
            if not device_field:
                device_field = "deviceid"
            imei = self.json.get(device_field, None)
            if imei is not None:
                device, created = Device.objects.get_or_create(imei=imei)
                self.device = device
                self.save()
                if self.project:
                    self.device.projects.add(self.project)

    def convert_correlation(self):
        if not self.correlation_id:
            identifier = str(self.id)
            if self.form.correlation_field is not None and self.json:
                identifier += self.json.get(self.form.correlation_field, None)
                identifier = identifier.zfill(3)
            random_number = random.choice("1234567890")
            value = int(identifier + random_number)
            suffix = "{:02d}".format(value % 97)
            self.correlation_id = identifier + random_number + suffix
            self.save()

    def get_and_save_json_of_xml(self):
        if self.json:
            file_content = self.json
        elif self.file:
            if "amazonaws" in self.file.url:
                file = urlopen(self.file.url)
            else:
                file = self.file
            file_content = flat_parse_xml_file(file)
            self.json = file_content
            self.save()
        else:
            file_content = {}
        return file_content

    def __str__(self):
        return "%s %s" % (self.form, self.name)

    def as_dict(self):
        file_content = self.get_and_save_json_of_xml()

        return {
            "uuid": self.uuid,
            "export_id": self.export_id,
            "file_name": self.file_name,
            "file_content": file_content,
            "file_url": self.file.url if self.file else None,
            "id": self.id,
            "form_id": self.form_id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "org_unit": self.org_unit.as_dict() if self.org_unit else None,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "period": self.period,
            "status": getattr(self, "status", None),
            "correlation_id": self.correlation_id,
        }

    def as_dict_with_parents(self):
        file_content = self.get_and_save_json_of_xml()
        return {
            "uuid": self.uuid,
            "export_id": self.export_id,
            "file_name": self.file_name,
            "file_content": file_content,
            "file_url": self.file.url if self.file else None,
            "id": self.id,
            "form_id": self.form_id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "org_unit": self.org_unit.as_dict_with_parents() if self.org_unit else None,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "period": self.period,
            "status": getattr(self, "status", None),
            "correlation_id": self.correlation_id,
        }

    def as_full_model(self):
        file_content = self.get_and_save_json_of_xml()
        return {
            "uuid": self.uuid,
            "id": self.id,
            "device_id": self.device.imei if self.device else None,
            "file_name": self.file_name,
            "file_url": self.file.url if self.file else None,
            "form_id": self.form_id,
            "form_name": self.form.name,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "org_unit": self.org_unit.as_dict_with_parents() if self.org_unit else None,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "period": self.period,
            "file_content": file_content,
            "files": [
                f.file.url if f.file else None for f in self.instancefile_set.all()
            ],
            "status": getattr(self, "status", None),
            "correlation_id": self.correlation_id,
        }

    def as_small_dict(self):
        return {
            "id": self.id,
            "file_url": self.file.url if self.file else None,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "period": self.period,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "files": [
                f.file.url if f.file else None for f in self.instancefile_set.all()
            ],
            "status": getattr(self, "status", None),
            "correlation_id": self.correlation_id,
        }


class InstanceFile(models.Model):
    UPLOADED_TO = "instancefiles/"
    instance = models.ForeignKey(
        Instance, on_delete=models.DO_NOTHING, null=True, blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.TextField(null=True, blank=True)
    file = models.FileField(upload_to=UPLOADED_TO, null=True, blank=True)

    def __str__(self):
        return "%s " % (self.name,)

    def as_dict(self):
        return {
            "form_id": self.form_id,
            "name": self.name,
            "id": self.id,
            "org_unit_types": [t.as_dict() for t in self.org_unit_types.all()],
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "file": self.file.url if self.file else None,
        }


class Device(models.Model):
    imei = models.CharField(max_length=20, null=True, blank=True)
    test_device = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    projects = models.ManyToManyField(Project, related_name="devices", blank=True)

    def __str__(self):
        return "%s " % (self.imei,)

    def as_dict(self):
        return {
            "imei": self.imei,
            "test_device": self.test_device,
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
        }


class DeviceOwnership(models.Model):
    device = models.ForeignKey(Device, on_delete=models.CASCADE)
    project = models.ForeignKey(
        Project, blank=True, null=True, on_delete=models.DO_NOTHING
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    start = models.DateTimeField(auto_now_add=True)
    end = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s - %s" % (self.device, self.user)

    def as_dict(self):
        return {
            "device": self.device.as_dict(),
            "user": self.user.profile.as_short_dict(),
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
        }


class Profile(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="iaso_profile"
    )

    def __str__(self):
        return "%s -- %s" % (self.user, self.account)

    def as_dict(self):
        return {
            "id": self.id,
            "first_name": self.user.first_name,
            "user_name": self.user.username,
            "last_name": self.user.last_name,
            "email": self.user.email,
            "account": self.account.as_dict(),
            "permissions": list(
                self.user.user_permissions.filter(
                    codename__startswith="iaso_"
                ).values_list("codename", flat=True)
            ),
            "is_superuser": self.user.is_superuser,
        }

    def as_short_dict(self):
        return {
            "id": self.id,
            "first_name": self.user.first_name,
            "user_name": self.user.username,
            "last_name": self.user.last_name,
            "email": self.user.email,
        }


class ExportRequest(models.Model):
    id = models.BigAutoField(
        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
    )
    params = JSONField(null=True, blank=True)
    launcher = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    result = JSONField(null=True, blank=True)

    finished = models.BooleanField(default=False)

    status = models.TextField(choices=STATUS_TYPE_CHOICES, default=QUEUED)

    instance_count = models.IntegerField()
    exported_count = models.IntegerField()
    errored_count = models.IntegerField()

    last_error_message = models.TextField()

    # user requested the export
    queued_at = models.DateTimeField(auto_now_add=True)
    # backend started processing the export
    started_at = models.DateTimeField(null=True, blank=True)
    # backend ended processing the export
    ended_at = models.DateTimeField(null=True, blank=True)


class ExportLog(models.Model):
    id = models.BigAutoField(
        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
    )
    sent = JSONField(null=True, blank=True)
    received = JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    http_status = models.IntegerField(null=True, blank=True)
    url = models.TextField(null=True, blank=True)


class ExportStatus(models.Model):
    id = models.BigAutoField(
        auto_created=True, primary_key=True, serialize=False, verbose_name="ID"
    )

    export_request = models.ForeignKey(ExportRequest, on_delete=models.CASCADE)
    instance = models.ForeignKey(Instance, on_delete=models.CASCADE)
    status = models.TextField(choices=STATUS_TYPE_CHOICES, default=QUEUED)
    mapping_version = models.ForeignKey(MappingVersion, on_delete=models.CASCADE)

    export_logs = models.ManyToManyField(ExportLog, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
