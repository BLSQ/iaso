import operator
import random
import re
import typing
from copy import copy
from functools import reduce
from logging import getLogger
from urllib.request import urlopen

from bs4 import BeautifulSoup as Soup  # type: ignore
from io import StringIO

import django_cte
from django.contrib.auth.models import User
from django.contrib.gis.db.models.fields import PointField
from django.contrib.gis.geos import Point
from django.contrib.postgres.aggregates import ArrayAgg
from django.core.paginator import Paginator
from django.core.validators import MinLengthValidator
from django.db import models
from django.db.models import Q, FilteredRelation, Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import ugettext_lazy as _

from hat.audit.models import log_modification, INSTANCE_API
from iaso.models.data_source import SourceVersion, DataSource
from iaso.models.org_unit import OrgUnit
from iaso.utils import flat_parse_xml_soup, extract_form_version_id
from .device import DeviceOwnership, Device
from .forms import Form, FormVersion
from .. import periods
from ..utils.jsonlogic import jsonlogic_to_q

logger = getLogger(__name__)


# For compat
QUARTER = periods.PERIOD_TYPE_QUARTER
MONTH = periods.PERIOD_TYPE_MONTH
SIX_MONTH = periods.PERIOD_TYPE_SIX_MONTH


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
    """Account represent a tenant (=roughly a client organisation or a country)"""

    name = models.TextField(unique=True, validators=[MinLengthValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
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
    projects = models.ManyToManyField("Project", related_name="match_algos", blank=True)

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
    """Represents an asynchronous function that will be run by a background worker for things like a data import"""

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
        We use a separate transaction, so we can report the progress even from a transaction, see services.py
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
        self.progress_message = message
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

    def filter_for_user(self, user: User):
        profile = user.iaso_profile
        queryset = self.filter(source_version__data_source__projects__in=profile.account.project_set.all())
        return queryset


class DomainGroupManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(domain__isnull=False)


class Group(models.Model):
    """Group of OrgUnit.

    Linked to a source_version, which is also used for tenancy"""

    name = models.TextField()
    source_ref = models.TextField(null=True, blank=True)
    org_units = models.ManyToManyField("OrgUnit", blank=True, related_name="groups")
    domain = models.CharField(max_length=10, choices=GROUP_DOMAIN, null=True, blank=True)
    block_of_countries = models.BooleanField(
        default=False
    )  # This field is used to mark a group containing only countries
    # The migration 0086_add_version_constraints add a constraint to ensure that the source version
    # is the same between the orgunit and the group
    source_version = models.ForeignKey(SourceVersion, null=True, blank=True, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = DefaultGroupManager()
    all_objects = models.Manager()
    domain_objects = DomainGroupManager()

    class Meta:
        base_manager_name = "all_objects"

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
            "block_of_countries": self.block_of_countries,  # This field is used to mark a group containing only countries
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


class InstanceQuerySet(django_cte.CTEQuerySet):
    def with_lock_info(self, user):
        """
        Annotate the QuerySet with the lock info for the given user.

        The following fields are added to the queryset:
        - lock_applying_to_user
        - count_lock_applying_to_user: number of locks that prevent user to modify the instance
        - count_active_lock: number of locks on instance that are not unlocked

        Implementation: we decided to make the lock calculation via annotations, so it's a lot faster with large querysets.
        """

        return (
            self.annotate(
                lock_applying_to_user=FilteredRelation(
                    "instancelock",
                    condition=Q(
                        ~Q(instancelock__top_org_unit__in=OrgUnit.objects.filter_for_user(user)),
                        Q(instancelock__unlocked_by__isnull=True),
                    ),
                )
            )
            .annotate(count_lock_applying_to_user=Count("lock_applying_to_user"))
            .annotate(count_active_lock=Count("instancelock", Q(instancelock__unlocked_by__isnull=True)))
        )

    def with_status(self):
        duplicates_subquery = (
            self.values("period", "form", "org_unit")
            .annotate(ids=ArrayAgg("id"))
            .annotate(
                c=models.Func(
                    "ids",
                    models.Value(1, output_field=models.IntegerField()),
                    function="array_length",
                    output_field=models.IntegerField(),
                )
            )
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
            .exclude(period="")
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
        periods_bound=None,
        status=None,
        instance_id=None,
        search=None,
        from_date=None,
        to_date=None,
        show_deleted=None,
        entity_id=None,
        json_content=None,
    ):
        queryset = self

        if from_date:
            queryset = queryset.filter(created_at__gte=from_date)

        if to_date:
            queryset = queryset.filter(created_at__lte=to_date)

        if period_ids:
            if isinstance(period_ids, str):
                period_ids = period_ids.split(",")
            queryset = queryset.filter(period__in=period_ids)
        if periods_bound:
            if periods_bound[0]:
                queryset = queryset.filter(period__gte=periods_bound[0])
            if periods_bound[1]:
                queryset = queryset.filter(period__lte=periods_bound[1])

        if instance_id:
            queryset = queryset.filter(id=instance_id)

        if org_unit_type_id:
            queryset = queryset.filter(org_unit__org_unit_type__in=org_unit_type_id.split(","))
        if org_unit_id:
            queryset = queryset.filter(org_unit_id=org_unit_id)

        if org_unit_parent_id:
            # Local import to avoid loop
            from iaso.models import OrgUnit

            parent = OrgUnit.objects.get(id=org_unit_parent_id)
            queryset = queryset.filter(org_unit__path__descendants=parent.path)

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

        if show_deleted:
            queryset = queryset.filter(deleted=True)
        else:
            # whatever don't show deleted submissions
            queryset = queryset.exclude(deleted=True)

        if entity_id:
            queryset = queryset.filter(entity_id=entity_id)

        if search:
            if search.startswith("ids:"):
                ids_str = search.replace("ids:", "")
                try:
                    ids = [int(i.strip()) for i in ids_str.split(",")]
                    queryset = queryset.filter(id__in=ids)
                except:
                    queryset = queryset.filter(id__in=[])
                    print("Failed parsing ids in search", search)
            elif search.startswith("refs:"):
                s = search.replace("refs:", "")
                try:
                    refs = re.findall("[A-Za-z0-9_-]+", s)
                    queryset = queryset.filter(org_unit__source_ref__in=refs)
                except:
                    print("Failed parsing refs in search", search)
            else:
                queryset = queryset.filter(
                    Q(org_unit__name__icontains=search) | Q(org_unit__aliases__contains=[search])
                )
        # add status annotation
        queryset = queryset.with_status()

        if status:
            statuses = status.split(",")
            queryset = queryset.filter(status__in=statuses)

        if json_content:
            q = jsonlogic_to_q(jsonlogic=json_content, field_prefix="json__")
            queryset = queryset.filter(q)

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

    def filter_for_user(self, user):
        profile = user.iaso_profile
        # Do a relative import to avoid an import loop
        from .org_unit import OrgUnit

        new_qs = self

        # If user is restricted to some org unit, filter on thoses
        if profile.org_units.exists():
            orgunits = OrgUnit.objects.hierarchy(profile.org_units.all())

            new_qs = new_qs.filter(org_unit__in=orgunits)
        new_qs = new_qs.filter(project__account=profile.account_id)
        return new_qs


InstanceManager = models.Manager.from_queryset(InstanceQuerySet)


class Instance(models.Model):
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
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, blank=True, null=True)
    last_modified_by = models.ForeignKey(
        User, on_delete=models.PROTECT, blank=True, null=True, related_name="last_modified_by"
    )
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
    accuracy = models.DecimalField(null=True, blank=True, decimal_places=2, max_digits=7)
    device = models.ForeignKey("Device", null=True, blank=True, on_delete=models.DO_NOTHING)
    period = models.TextField(null=True, blank=True, db_index=True)
    entity = models.ForeignKey("Entity", null=True, blank=True, on_delete=models.DO_NOTHING, related_name="instances")
    planning = models.ForeignKey(
        "Planning", null=True, blank=True, on_delete=models.DO_NOTHING, related_name="instances"
    )

    last_export_success_at = models.DateTimeField(null=True, blank=True)

    objects = InstanceManager()

    # Is instance SoftDeleted. It doesn't use the SoftDeleteModel deleted_at like the rest for historical reason.
    deleted = models.BooleanField(default=False)
    # See public_create_url workflow in enketo/README.md. used to tell we should export immediately
    to_export = models.BooleanField(default=False)

    # Used by Django Admin to link to the submission page in the dashboard
    def get_absolute_url(self):
        return f"/dashboard/forms/submission/instanceId/{self.pk}"

    def convert_location_from_field(self, field_name=None):
        f = field_name
        if f is None:
            f = self.form.location_field

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

    def xml_file_to_json(self, file: typing.IO) -> typing.Dict[str, typing.Any]:
        copy_io_utf8 = StringIO(file.read().decode("utf-8"))
        soup = Soup(copy_io_utf8, "xml", from_encoding="utf-8")

        form_version_id = extract_form_version_id(soup)
        if form_version_id:
            # TODO: investigate: can self.form be None here? What's the expected behavior?
            form_versions = self.form.form_versions.filter(version_id=form_version_id)  # type: ignore
            form_version = form_versions.first()
            if form_version:
                questions_by_path = form_version.questions_by_path()
                allowed_paths = set(questions_by_path.keys())
                allowed_paths.update(self.ALWAYS_ALLOWED_PATHS_XML)
                flat_results = flat_parse_xml_soup(
                    soup, [rg["name"] for rg in form_version.repeat_groups()], allowed_paths
                )
                if len(flat_results["skipped_paths"]) > 0:
                    logger.warning(
                        f"skipped {len(flat_results['skipped_paths'])} paths while parsing instance {self.id}",
                        flat_results,
                    )
                return flat_results["flat_json"]
            else:
                # warn old form, but keep it working ? or throw error
                return flat_parse_xml_soup(soup, [], None)["flat_json"]
        else:
            return flat_parse_xml_soup(soup, [], None)["flat_json"]

    def get_and_save_json_of_xml(self):
        """
        Convert the xml file to json and save it to the instance (if necessary)

        :return: in all cases, return the JSON representation of the instance
        """
        if self.json:
            # already converted, we can use this one
            return self.json
        elif self.file:
            # not converted yet, but we have a file, so we can convert it
            if "amazonaws" in self.file.url:
                file = urlopen(self.file.url)
            else:
                file = self.file

            self.json = self.xml_file_to_json(file)
            self.save()
            return self.json
        else:
            # no file, no json, when/why does this happen?
            return {}

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
        except NothingToExportError:
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
            "form_name": self.form.name if self.form else None,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "org_unit": self.org_unit.as_dict(with_groups=False) if self.org_unit else None,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "period": self.period,
            "status": getattr(self, "status", None),
            "correlation_id": self.correlation_id,
            "created_by": {
                "first_name": self.created_by.first_name,
                "user_name": self.created_by.username,
                "last_name": self.created_by.last_name,
            }
            if self.created_by
            else None,
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

        last_modified_by = None

        if self.last_modified_by is not None:
            last_modified_by = self.last_modified_by.username

        return {
            "uuid": self.uuid,
            "last_modified_by": last_modified_by,
            "modification": True,
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
        original = copy(self)
        self.deleted = True
        self.save()
        log_modification(original, self, INSTANCE_API, user=user)

    def restore(self, user: typing.Optional[User] = None):
        original = copy(self)
        self.deleted = False
        self.save()
        log_modification(original, self, INSTANCE_API, user=user)

    def can_user_modify(self, user):
        """Check only for lock, assume user have other perms"""
        # active locks for instance
        locks = self.instancelock_set.filter(unlocked_by__isnull=True)
        # highest lock
        highest_lock = locks.order_by("top_org_unit__path__depth").first()
        if not highest_lock:
            # No lock anyone can modify
            return True

        # can user access this orgunit
        from iaso.models import OrgUnit  # Local import to prevent loop

        if OrgUnit.objects.filter_for_user(user).filter(id=highest_lock.top_org_unit_id).exists():
            return True
        return False

    @property
    def has_org_unit(self):
        return self.org_unit if self.org_unit else None


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
    # Each profile/user has access to multiple orgunits. Having access to OU also give access to all its children
    org_units = models.ManyToManyField("OrgUnit", blank=True, related_name="iaso_profile")
    language = models.CharField(max_length=512, null=True, blank=True)
    dhis2_id = models.CharField(max_length=128, null=True, blank=True, help_text="Dhis2 user ID for SSO Auth")
    home_page = models.CharField(max_length=512, null=True, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["dhis2_id", "account"], name="dhis2_id_constraint")]

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
            "dhis2_id": self.dhis2_id,
            "home_page": self.home_page,
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

    def has_a_team(self):
        team = self.user.teams.filter(deleted_at=None).first()
        if team:
            return True
        return False


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


class BulkCreateUserCsvFile(models.Model):
    file = models.FileField(blank=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, null=True)


class InstanceLockQueryset(models.QuerySet):
    def actives(self):
        """Lock that don't have been unlocked"""
        return self.filter(unlocked_by__isnull=True)


class InstanceLock(models.Model):
    instance = models.ForeignKey("Instance", on_delete=models.CASCADE)
    locked_at = models.DateTimeField(auto_now_add=True)
    locked_by = models.ForeignKey(User, on_delete=models.PROTECT)
    unlocked_at = models.DateTimeField(blank=True, null=True)
    unlocked_by = models.ForeignKey(User, on_delete=models.PROTECT, blank=True, null=True, related_name="+")
    top_org_unit = models.ForeignKey("OrgUnit", on_delete=models.PROTECT, related_name="instance_lock")

    # We CASCADE if we delete the instance because the lock don't make sense then
    # but if the user or orgunit is deleted we should probably worry hence protect
    def __str__(self):
        return (
            f"{self.instance} - {self.locked_by} " + f"UNLOCKED by {self.unlocked_by}" if self.unlocked_by else "LOCKED"
        )

    class Meta:
        ordering = ["-locked_at"]
