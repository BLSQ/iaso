import random
import operator
import typing
from copy import copy
from urllib.request import urlopen
from functools import reduce
from django.db import models, transaction
from django.core.paginator import Paginator
from django.contrib.gis.db.models.fields import PointField
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.auth.models import User
from django.contrib.gis.geos import Point
from django.shortcuts import get_object_or_404
from django.utils.translation import ugettext_lazy as _
from hat.audit.models import log_modification, INSTANCE_API
from iaso.utils import flat_parse_xml_soup, as_soup, extract_form_version_id
from django.db.models import Q
from django.utils import timezone

from .device import DeviceOwnership, Device
from .forms import Form, FormVersion

from logging import getLogger

logger = getLogger(__name__)


YEAR = "YEAR"
QUARTER = "QUARTER"
MONTH = "MONTH"
SIX_MONTH = "SIX_MONTH"


AGGREGATE = "AGGREGATE"
EVENT = "EVENT"
DERIVED = "DERIVED"
EVENT_TRACKER = "EVENT_TRACKER"

MAPPING_TYPE_CHOICES = (
    (AGGREGATE, _("Aggregate")),
    (EVENT, _("Event")),
    (EVENT_TRACKER, _("Event Tracker")),
    (DERIVED, _("Derived")),
)

QUEUED = "QUEUED"
RUNNING = "RUNNING"
ERRORED = "ERRORED"
EXPORTED = "EXPORTED"
SUCCESS = "SUCCESS"
SKIPPED = "SKIPPED"
KILLED = "KILLED"

STATUS_TYPE_CHOICES = (
    (QUEUED, _("Queued")),
    (RUNNING, _("Running")),
    (EXPORTED, _("Exported")),
    (ERRORED, _("Errored")),
    (SKIPPED, _("Skipped")),
    (KILLED, _("Killed")),
    (SUCCESS, _("Success")),
)
ALIVE_STATUSES = [QUEUED, RUNNING]


class KilledException(Exception):
    pass


def generate_id_for_dhis_2():
    letters = "abcdefghijklmnopqrstuvwxyz"
    letters = letters + letters.upper()
    all_chars = "0123456789" + letters
    first_letter = random.choice(letters)
    other_letters = random.choices(all_chars, k=10)
    return first_letter + "".join(other_letters)


class AccountFeatureFlag(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255, primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class Account(models.Model):
    name = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    users = models.ManyToManyField(User, blank=True)
    default_version = models.ForeignKey("SourceVersion", null=True, blank=True, on_delete=models.SET_NULL)
    feature_flags = models.ManyToManyField(AccountFeatureFlag)

    def as_dict(self):
        return {
            "name": self.name,
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "default_version": self.default_version.as_dict() if self.default_version else None,
            "feature_flags": [flag.code for flag in self.feature_flags.all()],
        }

    def __str__(self):
        return "%s " % (self.name,)


class DataSource(models.Model):
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

    def __str__(self):
        return "%s " % (self.name,)

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
        }

    def as_list(self):
        return {"name": self.name, "id": self.id}


class SourceVersion(models.Model):
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name="versions")
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


class RecordType(models.Model):
    projects = models.ManyToManyField("Project", related_name="record_types", blank=True)
    name = models.TextField()
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)


class Record(models.Model):
    value = models.DecimalField(max_digits=19, decimal_places=10)
    version = models.ForeignKey(SourceVersion, null=True, blank=True, on_delete=models.CASCADE)
    org_unit = models.ForeignKey("OrgUnit", null=True, blank=True, on_delete=models.CASCADE)
    record_type = models.ForeignKey(RecordType, on_delete=models.CASCADE, null=True, blank=True)
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
    result = models.JSONField(null=True, blank=True)
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
            "launcher": self.launcher.iaso_profile.as_dict() if self.launcher and self.launcher.iaso_profile else None,
            "destination": self.version_1.as_dict() if self.version_1 else None,
            "source": self.version_2.as_dict() if self.version_2 else None,
            "links_count": links_count,
        }

    def as_list(self):
        return {
            "algorithm_name": self.algorithm.name,
            "algorithm_id": self.algorithm.id,
            "id": self.id,
            "destination": self.version_1.as_list() if self.version_1 else None,
            "source": self.version_2.as_list() if self.version_2 else None,
        }


class Task(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    progress_value = models.IntegerField(default=0)
    end_value = models.IntegerField(default=0)
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    launcher = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    result = models.JSONField(null=True, blank=True)
    status = models.CharField(choices=STATUS_TYPE_CHOICES, max_length=40, default=QUEUED)
    name = models.TextField()
    params = models.JSONField(null=True, blank=True)
    queue_answer = models.JSONField(null=True, blank=True)
    progress_message = models.TextField(null=True, blank=True)
    should_be_killed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return "%s - %s - %s -%s" % (
            self.name,
            self.launcher,
            self.status,
            self.created_at,
        )

    def as_dict(self):
        return {
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "started_at": self.started_at.timestamp() if self.started_at else None,
            "ended_at": self.ended_at.timestamp() if self.ended_at else None,
            "params": self.params,
            "result": self.result,
            "status": self.status,
            "launcher": self.launcher.iaso_profile.as_short_dict()
            if self.launcher and self.launcher.iaso_profile
            else None,
            "progress_value": self.progress_value,
            "end_value": self.end_value,
            "name": self.name,
            "queue_answer": self.queue_answer,
            "progress_message": self.progress_message,
            "should_be_killed": self.should_be_killed,
        }

    def report_progress_and_stop_if_killed(self, progress_value=None, progress_message=None, end_value=None):
        """Save progress and check if we have been killed
        Warning: If you are in a transaction/atomic bloc the progress won't be seen from the API
        since it's local to the connexion.
        """
        logger.info(f"Task {self} reported {progress_message}")
        self.refresh_from_db()
        if self.should_be_killed:
            logger.warning(f"Stopping Task {self} as it as been marked for kill")
            self.status = KILLED
            self.ended_at = timezone.now()
            self.result = {"result": KILLED, "message": "Killed"}
            self.save()
            raise KilledException("Killed by user")

        if progress_value:
            self.progress_value = progress_value
        if progress_message:
            self.progress_message = progress_message
        if end_value:
            self.end_value = end_value
        self.save()

    def report_success(self, message=None):
        logger.info(f"Task {self} reported success with message {message}")
        self.status = SUCCESS
        self.ended_at = timezone.now()
        self.result = {"result": SUCCESS, "message": message}
        self.save()


class Link(models.Model):
    destination = models.ForeignKey(
        "OrgUnit",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="source_set",
    )
    source = models.ForeignKey(
        "OrgUnit",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="destination_set",
    )
    validated = models.BooleanField(default=False)
    validator = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    validation_date = models.DateTimeField(auto_now=True, null=True, blank=True)

    similarity_score = models.SmallIntegerField(null=True)
    algorithm_run = models.ForeignKey(AlgorithmRun, on_delete=models.CASCADE, null=True, blank=True)

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
            "validator": self.validator.iaso_profile.as_dict()
            if self.validator and self.validator.iaso_profile
            else None,
            "validation_date": self.validation_date,
            "similarity_score": self.similarity_score,
            "algorithm_run": self.algorithm_run.as_dict() if self.algorithm_run else None,
        }

    def as_full_dict(self):
        return {
            "destination": self.destination.as_dict_with_parents(),
            "source": self.source.as_dict_with_parents(),
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "validated": self.validated,
            "validator": self.validator.iaso_profile.as_dict()
            if self.validator and self.validator.iaso_profile
            else None,
            "validation_date": self.validation_date,
            "similarity_score": self.similarity_score,
            "algorithm_run": self.algorithm_run.as_dict() if self.algorithm_run else None,
        }


GROUP_DOMAIN = [
    ("POLIO", _("Polio")),
]


class DefaultGroupManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(domain=None)


class DomainGroupManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(domain__isnull=False)


class Group(models.Model):
    name = models.TextField()
    source_ref = models.TextField(null=True, blank=True)
    org_units = models.ManyToManyField("OrgUnit", blank=True, related_name="groups")
    domain = models.CharField(max_length=10, choices=GROUP_DOMAIN, null=True, blank=True)

    # The migration 0086_add_version_constraints add a constraint to ensure that the source version
    # is the same between the orgunit and the group
    source_version = models.ForeignKey(SourceVersion, null=True, blank=True, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = DefaultGroupManager()
    domain_objects = DomainGroupManager()

    def __str__(self):
        return "%s | %s " % (self.name, self.source_version)

    def as_dict(self, with_counts=True):
        res = {
            "id": self.id,
            "name": self.name,
            "source_ref": self.source_ref,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "source_version": self.source_version_id,
        }

        if with_counts:
            res["org_unit_count"] = self.org_units.count()

        return res


class GroupSet(models.Model):
    name = models.TextField()
    source_ref = models.TextField(null=True, blank=True)
    source_version = models.ForeignKey(SourceVersion, null=True, blank=True, on_delete=models.CASCADE)
    groups = models.ManyToManyField(Group, blank=True, related_name="group_sets")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s | %s " % (self.name, self.source_version)


class Mapping(models.Model):
    name = models.TextField()
    data_source = models.ForeignKey(DataSource, on_delete=models.CASCADE, related_name="mappings")
    form = models.ForeignKey("Form", on_delete=models.DO_NOTHING, null=True, blank=True)
    mapping_type = models.TextField(choices=MAPPING_TYPE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return "%s %s" % (self.form, self.mapping_type)

    def is_aggregate(self):
        return self.mapping_type == AGGREGATE

    def is_event_tracker(self):
        return self.mapping_type == EVENT_TRACKER

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

    form_version = models.ForeignKey("FormVersion", on_delete=models.CASCADE, related_name="mapping_versions")
    mapping = models.ForeignKey(
        Mapping,
        on_delete=models.CASCADE,
        related_name="versions",
        null=True,
        blank=True,
    )
    name = models.TextField()
    json = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = [["form_version", "name"]]

    def __str__(self):
        return "%s - %s" % (self.form_version, self.name)

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
        }


class ExternalCredentials(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE, related_name="credentials")

    name = models.TextField()
    login = models.TextField()
    password = models.TextField()
    url = models.TextField()

    @property
    def is_valid(self) -> bool:
        return bool(self.url and self.password and self.login)

    def __str__(self):
        return "%s - %s - %s (%s)" % (self.name, self.login, self.url, self.account)

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "login": self.login,
            "url": self.url,
            "is_valid": self.is_valid,
        }


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
            .annotate(ready_count=models.Count("id", distinct=True, filter=models.Q(status=Instance.STATUS_READY)))
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
        instance_id=None,
        search=None,
        from_date=None,
        to_date=None,
        show_deleted=None,
    ):
        queryset = self

        if from_date:
            queryset = queryset.filter(created_at__gte=from_date)

        if to_date:
            queryset = queryset.filter(created_at__lte=to_date)

        if period_ids:
            queryset = queryset.filter(period__in=period_ids.split(","))

        if instance_id:
            queryset = queryset.filter(id=instance_id)

        if org_unit_type_id:
            queryset = queryset.filter(org_unit__org_unit_type__in=org_unit_type_id.split(","))
        if org_unit_id:
            queryset = queryset.filter(org_unit_id=org_unit_id)

        if org_unit_parent_id:
            queryset = queryset.filter(
                Q(org_unit__id=org_unit_parent_id)
                | Q(org_unit__parent__id=org_unit_parent_id)
                | Q(org_unit__parent__parent__id=org_unit_parent_id)
                | Q(org_unit__parent__parent__parent__id=org_unit_parent_id)
                | Q(org_unit__parent__parent__parent__parent__id=org_unit_parent_id)
                | Q(org_unit__parent__parent__parent__parent__parent__id=org_unit_parent_id)
                | Q(org_unit__parent__parent__parent__parent__parent__parent__id=org_unit_parent_id)
                | Q(org_unit__parent__parent__parent__parent__parent__parent__parent__id=org_unit_parent_id)
            )

        if with_location == "true":
            queryset = queryset.filter(location__isnull=False)

        if with_location == "false":
            queryset = queryset.filter(location__isnull=True)

        if device_id:
            queryset = queryset.filter(device__id=device_id)

        if device_ownership_id:
            device_ownership = get_object_or_404(DeviceOwnership, pk=device_ownership_id)
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

        if show_deleted:
            queryset = queryset.filter(deleted=True)
        else:
            # whatever don't show deleted submissions
            queryset = queryset.exclude(deleted=True)

        if search:
            if search.startswith("ids:"):
                ids_str = search.replace("ids:", "")
                try:
                    ids = [int(i.strip()) for i in ids_str.split(",")]
                    queryset = queryset.filter(id__in=ids)
                except:
                    queryset = queryset.filter(id__in=[])
                    print("Failed parsing ids in search", search)
            else:
                queryset = queryset.filter(
                    Q(org_unit__name__icontains=search) | Q(org_unit__aliases__contains=[search])
                )

        return queryset

    def for_org_unit_hierarchy(self, org_unit):
        # TODO: we could write our own descendants lookup instead of using the one provided in django-ltree
        # TODO: as it does not handle arrays of path (ltree does)
        # We need to cast PathValue instances to strings - this could be fixed upstream
        # (https://github.com/mariocesar/django-ltree/issues/8)
        if isinstance(org_unit, list):
            query = reduce(
                operator.or_,
                [Q(org_unit__path__descendants=str(ou.path)) for ou in org_unit],
            )
        else:
            query = Q(org_unit__path__descendants=str(org_unit.path))

        return self.filter(query)


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
    location = PointField(null=True, blank=True, dim=3, srid=4326)
    org_unit = models.ForeignKey("OrgUnit", on_delete=models.DO_NOTHING, null=True, blank=True)
    form = models.ForeignKey(
        "Form",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="instances",
    )
    project = models.ForeignKey("Project", blank=True, null=True, on_delete=models.DO_NOTHING)
    json = models.JSONField(null=True, blank=True)
    accuracy = models.DecimalField(null=True, decimal_places=2, max_digits=7)
    device = models.ForeignKey("Device", null=True, blank=True, on_delete=models.DO_NOTHING)
    period = models.TextField(null=True, blank=True, db_index=True)

    last_export_success_at = models.DateTimeField(null=True, blank=True)

    objects = InstanceQuerySet.as_manager()

    deleted = models.BooleanField(default=False)
    to_export = models.BooleanField(default=False)

    def convert_location_from_field(self, field_name=None):
        f = field_name
        if f is None:
            f = self.form.location_field

        if self.json and f:
            location = self.json.get(f, None)
            if location:
                latitude, longitude, altitude, accuracy = [float(x) for x in location.split(" ")]
                self.location = Point(x=longitude, y=latitude, z=altitude, srid=4326)
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
            soup = as_soup(file)
            form_version_id = extract_form_version_id(soup)
            if form_version_id:
                form_versions = self.form.form_versions.filter(version_id=form_version_id)
                form_version = form_versions.first()
                if form_version:

                    self.json = flat_parse_xml_soup(soup, [rg["name"] for rg in form_version.repeat_groups()])
                else:
                    # warn old form, but keep it working ? or throw error
                    self.json = flat_parse_xml_soup(soup, [])
            else:
                self.json = flat_parse_xml_soup(soup, [])
            file_content = self.json
            self.save()
        else:
            file_content = {}
        return file_content

    def get_form_version(self):
        json = self.get_and_save_json_of_xml()

        try:
            return self.form.form_versions.get(version_id=json["_version"])
        except (KeyError, FormVersion.DoesNotExist):
            return None

    def export(self, launcher=None, force_export=False):
        from iaso.dhis2.datavalue_exporter import DataValueExporter
        from iaso.dhis2.export_request_builder import (
            ExportRequestBuilder,
            NothingToExportError,
        )

        try:
            export_request = ExportRequestBuilder().build_export_request(
                filters={"instance_id": self.id},
                launcher=launcher,
                force_export=force_export,
            )

            DataValueExporter().export_instances(export_request)
            self.refresh_from_db()
        except NothingToExportError as error:
            print("Export failed for instance", self)

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
            "org_unit": self.org_unit.as_dict(with_groups=False) if self.org_unit else None,
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
        form_version = self.get_form_version()

        return {
            "uuid": self.uuid,
            "id": self.id,
            "device_id": self.device.imei if self.device else None,
            "file_name": self.file_name,
            "file_url": self.file.url if self.file else None,
            "form_id": self.form_id,
            "form_name": self.form.name,
            "form_descriptor": form_version.get_or_save_form_descriptor() if form_version is not None else None,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "org_unit": self.org_unit.as_dict_with_parents(light=False, light_parents=False) if self.org_unit else None,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "period": self.period,
            "file_content": file_content,
            "files": [f.file.url if f.file else None for f in self.instancefile_set.filter(deleted=False)],
            "status": getattr(self, "status", None),
            "correlation_id": self.correlation_id,
            "last_export_success_at": self.last_export_success_at.timestamp() if self.last_export_success_at else None,
            "export_statuses": [
                {
                    "status": export_status.status,
                    "created_at": export_status.created_at.timestamp() if export_status.created_at else None,
                    "export_request": {
                        "launcher": {
                            "full_name": export_status.export_request.launcher.get_full_name()
                            if export_status.export_request.launcher
                            else "AUTO UPLOAD",
                            "email": export_status.export_request.launcher.email
                            if export_status.export_request.launcher
                            else "AUTO UPLOAD",
                        },
                        "last_error_message": f"{export_status.last_error_message}, {export_status.export_request.last_error_message}",
                    },
                }
                for export_status in Paginator(self.exportstatus_set.order_by("-id"), 3).object_list
            ],
            "deleted": self.deleted,
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
            "files": [f.file.url if f.file else None for f in self.instancefile_set.filter(deleted=False)],
            "status": getattr(self, "status", None),
            "correlation_id": self.correlation_id,
        }

    def soft_delete(self, user: typing.Optional[User] = None):
        with transaction.atomic():
            original = copy(self)
            self.deleted = True
            self.save()
            log_modification(original, self, INSTANCE_API, user=user)


class InstanceFile(models.Model):
    UPLOADED_TO = "instancefiles/"
    instance = models.ForeignKey(Instance, on_delete=models.DO_NOTHING, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.TextField(null=True, blank=True)
    file = models.FileField(upload_to=UPLOADED_TO, null=True, blank=True)
    deleted = models.BooleanField(default=False)

    def __str__(self):
        return "%s " % (self.name,)


class Profile(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="iaso_profile")
    external_user_id = models.CharField(max_length=512, null=True, blank=True)
    org_units = models.ManyToManyField("OrgUnit", blank=True, related_name="iaso_profile")
    language = models.CharField(max_length=512, null=True, blank=True)

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
                self.user.user_permissions.filter(codename__startswith="iaso_").values_list("codename", flat=True)
            ),
            "is_superuser": self.user.is_superuser,
            "org_units": [o.as_small_dict() for o in self.org_units.all().order_by("name")],
            "language": self.language,
            "user_id": self.user.id,
        }

    def as_short_dict(self):
        return {
            "id": self.id,
            "first_name": self.user.first_name,
            "user_name": self.user.username,
            "last_name": self.user.last_name,
            "email": self.user.email,
            "language": self.language,
            "user_id": self.user.id,
        }


class ExportRequest(models.Model):
    id = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")
    params = models.JSONField(null=True, blank=True)
    launcher = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    result = models.JSONField(null=True, blank=True)

    finished = models.BooleanField(default=False)

    status = models.TextField(choices=STATUS_TYPE_CHOICES, default=QUEUED)

    instance_count = models.IntegerField()
    exported_count = models.IntegerField()
    errored_count = models.IntegerField()

    last_error_message = models.TextField()
    continue_on_error = models.BooleanField(default=False)
    # user requested the export
    queued_at = models.DateTimeField(auto_now_add=True)
    # backend started processing the export
    started_at = models.DateTimeField(null=True, blank=True)
    # backend ended processing the export
    ended_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.id} ({self.status}) {self.params} {self.last_error_message} {self.launcher}"


class ExportLog(models.Model):
    id = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")
    sent = models.JSONField(null=True, blank=True)
    received = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    http_status = models.IntegerField(null=True, blank=True)
    url = models.TextField(null=True, blank=True)

    def __str__(self):
        return (
            "ExportLog("
            + str(self.id)
            + "): "
            + str(self.url)
            + " got "
            + str(self.http_status)
            + " received: "
            + str(self.received)
            + " sent: "
            + str(self.sent)
        )


class ExportStatus(models.Model):
    id = models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")

    export_request = models.ForeignKey(ExportRequest, on_delete=models.CASCADE)
    instance = models.ForeignKey(Instance, on_delete=models.CASCADE)
    status = models.TextField(choices=STATUS_TYPE_CHOICES, default=QUEUED)
    mapping_version = models.ForeignKey(MappingVersion, on_delete=models.CASCADE)

    export_logs = models.ManyToManyField(ExportLog, blank=True)
    last_error_message = models.TextField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return "ExportStatus " + str(self.id)


class FeatureFlag(models.Model):
    INSTANT_EXPORT = "INSTANT_EXPORT"
    TAKE_GPS_ON_FORM = "TAKE_GPS_ON_FORM"
    REQUIRE_AUTHENTICATION = "REQUIRE_AUTHENTICATION"
    FORMS_AUTO_UPLOAD = "FORMS_AUTO_UPLOAD"

    FEATURE_FLAGS = {
        (INSTANT_EXPORT, "Instant export", _("Immediate export of instances to DHIS2")),
        (
            TAKE_GPS_ON_FORM,
            "Mobile: take GPS on new form",
            _("GPS localization on start of instance on mobile"),
        ),
        (
            REQUIRE_AUTHENTICATION,
            "Mobile: authentication required",
            _("Require authentication on mobile"),
        ),
        (
            FORMS_AUTO_UPLOAD,
            "",
            _(
                "Saving a form as finalized on mobile triggers an upload attempt immediately + everytime network becomes available"
            ),
        ),
    }

    code = models.CharField(max_length=30, null=False, blank=False, unique=True)
    name = models.CharField(max_length=100, null=False, blank=False)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
