import re
import typing

from logging import getLogger

from django import forms as dj_forms
from django.contrib import auth
from django.contrib.auth.models import AnonymousUser, User
from django.contrib.postgres.aggregates import ArrayAgg
from django.contrib.postgres.fields import ArrayField
from django.core.validators import MinLengthValidator
from django.db import models
from django.db.models import Case, Q, When
from django.utils import timezone
from django.utils.functional import cached_property
from django.utils.translation import gettext_lazy as _
from phonenumber_field.modelfields import PhoneNumberField
from phonenumbers.phonenumberutil import region_code_for_number

from hat.menupermissions.constants import MODULES
from iaso.models.data_source import DataSource, SourceVersion
from iaso.models.org_unit import OrgUnit

from .. import periods
from .instances import Instance
from .project import Project


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


class AccountFeatureFlag(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=255, primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.code})"


class ChoiceArrayField(ArrayField):
    """
    A field that allows us to store an array of choices.
    Uses Django's Postgres ArrayField
    and a MultipleChoiceField for its formfield.
    """

    def formfield(self, **kwargs):
        defaults = {
            "form_class": dj_forms.MultipleChoiceField,
            "choices": self.base_field.choices,
        }
        defaults.update(kwargs)
        # Skip our parent's formfield implementation completely as we don't
        # care for it.
        # pylint:disable=bad-super-call
        return super(ArrayField, self).formfield(**defaults)


MODULE_CHOICES = ((modu["codename"], modu["name"]) for modu in MODULES)


class Account(models.Model):
    """Account represent a tenant (=roughly a client organisation or a country)"""

    name = models.TextField(unique=True, validators=[MinLengthValidator(1)])
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    default_version = models.ForeignKey("SourceVersion", null=True, blank=True, on_delete=models.SET_NULL)
    feature_flags = models.ManyToManyField(AccountFeatureFlag)
    user_manual_path = models.TextField(null=True, blank=True)
    modules = ChoiceArrayField(
        models.CharField(max_length=100, choices=MODULE_CHOICES), blank=True, null=True, default=list
    )
    # analytics_script is no longer used (replaced by the plausible setup) - it's kept in case we need another
    # specific analytics setup for a specific account
    analytics_script = models.TextField(blank=True, null=True)
    custom_translations = models.JSONField(null=True, blank=True)

    def as_dict(self):
        return {
            "name": self.name,
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "default_version": self.default_version.as_dict() if self.default_version else None,
            "feature_flags": [flag.code for flag in self.feature_flags.all()],
            "user_manual_path": self.user_manual_path,
            "analytics_script": self.analytics_script,
            "custom_translations": self.custom_translations,
        }

    def as_small_dict(self):
        return {
            "name": self.name,
            "id": self.id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "default_version": self.default_version.as_small_dict() if self.default_version else None,
            "feature_flags": [flag.code for flag in self.feature_flags.all()],
            "user_manual_path": self.user_manual_path,
            "analytics_script": self.analytics_script,
            "modules": self.modules,
            "custom_translations": self.custom_translations,
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
    created_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name="created_tasks")
    launcher = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    result = models.JSONField(null=True, blank=True)
    status = models.CharField(choices=STATUS_TYPE_CHOICES, max_length=40, default=QUEUED)
    name = models.TextField()
    params = models.JSONField(null=True, blank=True)
    queue_answer = models.JSONField(null=True, blank=True)
    progress_message = models.TextField(null=True, blank=True)
    should_be_killed = models.BooleanField(default=False)
    external = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["name"]),
            models.Index(fields=["status"]),
        ]

    def __str__(self):
        return "%s - %s - %s -%s" % (
            self.name,
            self.created_by,
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
            "created_by": (
                self.created_by.iaso_profile.as_short_dict()
                if self.created_by and self.created_by.iaso_profile
                else None
            ),
            "launcher": (
                self.launcher.iaso_profile.as_short_dict() if self.launcher and self.launcher.iaso_profile else None
            ),
            "progress_value": self.progress_value,
            "end_value": self.end_value,
            "name": self.name,
            "queue_answer": self.queue_answer,
            "progress_message": self.progress_message,
            "should_be_killed": self.should_be_killed,
        }

    def stop_if_killed(self):
        self.refresh_from_db()
        if self.should_be_killed:
            logger.warning(f"Stopping Task {self} as it as been marked for kill")
            self.status = KILLED
            self.ended_at = timezone.now()
            self.result = {"result": KILLED, "message": "Killed"}
            self.save()

    def report_progress_and_stop_if_killed(self, progress_value=None, progress_message=None, end_value=None):
        """Save progress and check if we have been killed
        We use a separate transaction, so we can report the progress even from a transaction, see services.py
        """
        logger.info(f"Task {self} reported {progress_message}")
        self.refresh_from_db()
        if self.should_be_killed:
            self.stop_if_killed()
            raise KilledException("Killed by user")

        if progress_value:
            self.progress_value = progress_value
        if progress_message:
            self.progress_message = progress_message
        if end_value:
            self.end_value = end_value
        self.save()

    def report_success_with_result(self, message=None, result_data=None):
        logger.info(f"Task {self} reported success with message {message}")
        self.progress_message = message
        self.status = SUCCESS
        self.ended_at = timezone.now()
        self.result = {"result": SUCCESS, "data": result_data}
        self.save()

    def report_success(self, message=None):
        logger.info(f"Task {self} reported success with message {message}")
        self.progress_message = message
        self.status = SUCCESS
        self.ended_at = timezone.now()
        self.result = {"result": SUCCESS, "message": message}
        self.save()

    def terminate_with_error(self, message=None):
        self.refresh_from_db()
        logger.error(f"Task {self} ended in error")
        self.status = ERRORED
        self.ended_at = timezone.now()
        self.result = {"result": ERRORED, "message": message if message else "Error"}
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
            "validator": (
                self.validator.iaso_profile.as_dict() if self.validator and self.validator.iaso_profile else None
            ),
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
            "validator": (
                self.validator.iaso_profile.as_dict() if self.validator and self.validator.iaso_profile else None
            ),
            "validation_date": self.validation_date,
            "similarity_score": self.similarity_score,
            "algorithm_run": self.algorithm_run.as_dict() if self.algorithm_run else None,
        }


class GroupQuerySet(models.QuerySet):
    def filter_for_user(self, user: User):
        profile = user.iaso_profile
        queryset = self
        version_ids = (
            SourceVersion.objects.filter(data_source__projects__account=profile.account)
            .values_list("id", flat=True)
            .distinct()
        )
        queryset = queryset.filter(source_version_id__in=version_ids)
        return queryset


class Group(models.Model):
    """Group of OrgUnit.

    Linked to a source_version, which is also used for tenancy"""

    name = models.TextField()
    source_ref = models.TextField(null=True, blank=True)
    org_units = models.ManyToManyField("OrgUnit", blank=True, related_name="groups")
    block_of_countries = models.BooleanField(
        default=False
    )  # This field is used to mark a group containing only countries
    # The migration 0086_add_version_constraints add a constraint to ensure that the source version
    # is the same between the orgunit and the group
    source_version = models.ForeignKey(SourceVersion, null=True, blank=True, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager.from_queryset(GroupQuerySet)()

    def __str__(self):
        return "%s | %s " % (self.name, self.source_version)

    def as_small_dict(self):
        return {
            "id": self.id,
            "name": self.name,
        }

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


class GroupSetQuerySet(models.QuerySet):
    def filter_for_user_and_app_id(
        self, user: typing.Union[User, AnonymousUser, None], app_id: typing.Optional[str] = None
    ):
        queryset = self
        if user and user.is_anonymous and app_id is None:
            return self.none()

        if user and user.is_authenticated:
            # avoid creating duplicated record by joining projects's datasources
            version_ids = (
                SourceVersion.objects.filter(data_source__projects__account=user.iaso_profile.account)
                .values_list("id", flat=True)
                .distinct()
            )
            queryset = queryset.filter(source_version_id__in=version_ids)

        if app_id is not None:
            try:
                project = Project.objects.get_for_user_and_app_id(user, app_id)

                queryset = queryset.filter(source_version__data_source__projects__in=[project])

            except Project.DoesNotExist:
                return self.none()

        return queryset

    def prefetch_source_version_details(self):
        queryset = self
        queryset = queryset.prefetch_related("source_version")
        queryset = queryset.prefetch_related("source_version__data_source")
        return queryset

    def prefetch_groups_details(self):
        queryset = self
        queryset = queryset.prefetch_related("groups__source_version")
        queryset = queryset.prefetch_related("groups__source_version__data_source")
        return queryset


GroupSetManager = models.Manager.from_queryset(GroupSetQuerySet)


class GroupSet(models.Model):
    class GroupBelonging(models.TextChoices):
        SINGLE = _("SINGLE")
        MULTIPLE = _("MULTIPLE")

    name = models.TextField()
    source_ref = models.TextField(null=True, blank=True)
    source_version = models.ForeignKey(SourceVersion, null=True, blank=True, on_delete=models.CASCADE)
    groups = models.ManyToManyField(Group, blank=True, related_name="group_sets")
    group_belonging = models.TextField(
        choices=GroupBelonging.choices, default=GroupBelonging.SINGLE, null=False, blank=False, max_length=10
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = GroupSetManager()

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

    def is_simple_event(self):
        return self.mapping_type == EVENT

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

    EVENT_DATE_SOURCE_FROM_SUBMISSION_CREATED_AT = "FROM_SUBMISSION_CREATED_AT"
    EVENT_DATE_SOURCE_FROM_SUBMISSION_PERIOD = "FROM_SUBMISSION_PERIOD"

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

    @staticmethod
    def get_event_date_source(json):
        if "event_date_source" in json:
            return json["event_date_source"]
        return MappingVersion.EVENT_DATE_SOURCE_FROM_SUBMISSION_CREATED_AT


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


class ProfileQuerySet(models.QuerySet):
    def with_editable_org_unit_types(self):
        qs = self
        return qs.annotate(
            annotated_editable_org_unit_types_ids=ArrayAgg(
                "editable_org_unit_types__id", distinct=True, filter=Q(editable_org_unit_types__isnull=False)
            ),
            annotated_user_roles_editable_org_unit_type_ids=ArrayAgg(
                "user_roles__editable_org_unit_types__id",
                distinct=True,
                filter=Q(user_roles__editable_org_unit_types__isnull=False),
            ),
        )


class Profile(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="iaso_profile")
    external_user_id = models.CharField(max_length=512, null=True, blank=True)
    organization = models.CharField(max_length=512, null=True, blank=True)
    # Each profile/user has access to multiple orgunits. Having access to OU also give access to all its children
    org_units = models.ManyToManyField("OrgUnit", blank=True, related_name="iaso_profile")
    language = models.CharField(max_length=512, null=True, blank=True)
    dhis2_id = models.CharField(max_length=128, null=True, blank=True, help_text="Dhis2 user ID for SSO Auth")
    home_page = models.CharField(max_length=512, null=True, blank=True)
    user_roles = models.ManyToManyField("UserRole", related_name="iaso_profile", blank=True)
    projects = models.ManyToManyField("Project", related_name="iaso_profile", blank=True)
    phone_number = PhoneNumberField(blank=True)
    # Each user can have restricted write access to OrgUnits, based on their type.
    # By default, empty `editable_org_unit_types` means access to everything.
    editable_org_unit_types = models.ManyToManyField(
        "OrgUnitType", related_name="editable_by_iaso_profile_set", blank=True
    )

    objects = models.Manager.from_queryset(ProfileQuerySet)()

    class Meta:
        constraints = [models.UniqueConstraint(fields=["dhis2_id", "account"], name="dhis2_id_constraint")]

    def __str__(self):
        return "%s -- %s" % (self.user, self.account)

    def get_hierarchy_for_user(self):
        return OrgUnit.objects.filter_for_user_and_app_id(self.user)

    def get_user_roles_editable_org_unit_type_ids(self):
        try:
            return self.annotated_user_roles_editable_org_unit_type_ids
        except AttributeError:
            return list(
                self.user_roles.values_list("editable_org_unit_types__id", flat=True)
                .distinct("id")
                .exclude(editable_org_unit_types__id__isnull=True)
            )

    def as_dict(self, small=False):
        user_roles = self.user_roles.all()
        user_group_permissions = list(
            map(lambda permission: permission.split(".")[1], list(self.user.get_group_permissions()))
        )
        user_permissions = list(
            self.user.user_permissions.filter(codename__startswith="iaso_").values_list("codename", flat=True)
        )
        all_permissions = user_group_permissions + user_permissions
        permissions = list(set(all_permissions))
        try:
            editable_org_unit_type_ids = self.annotated_editable_org_unit_types_ids
        except AttributeError:
            editable_org_unit_type_ids = [out.pk for out in self.editable_org_unit_types.all()]

        user_roles_editable_org_unit_type_ids = self.get_user_roles_editable_org_unit_type_ids()

        other_accounts = []
        user_infos = self.user
        if hasattr(self.user, "tenant_user"):
            other_accounts = self.user.tenant_user.get_other_accounts()
            user_infos = self.user.tenant_user.main_user

        result = {
            "id": self.id,
            "first_name": user_infos.first_name,
            "user_name": user_infos.username,
            "last_name": user_infos.last_name,
            "email": user_infos.email,
            "permissions": permissions,
            "user_permissions": user_permissions,
            "is_superuser": self.user.is_superuser,
            "user_roles": list(role.id for role in user_roles),
            "user_roles_permissions": list(role.as_dict() for role in user_roles),
            "language": self.language,
            "organization": self.organization,
            "user_id": self.user.id,
            "dhis2_id": self.dhis2_id,
            "home_page": self.home_page,
            "phone_number": self.phone_number.as_e164 if self.phone_number else None,
            "country_code": region_code_for_number(self.phone_number).lower() if self.phone_number else None,
            "projects": [p.as_dict() for p in self.projects.all().order_by("name")],
            "other_accounts": [account.as_dict() for account in other_accounts],
            "editable_org_unit_type_ids": editable_org_unit_type_ids,
            "user_roles_editable_org_unit_type_ids": user_roles_editable_org_unit_type_ids,
        }

        if small:
            return result | {
                "org_units": [o.as_very_small_dict() for o in self.org_units.all()],
            }
        return result | {
            "account": self.account.as_small_dict(),
            "org_units": [o.as_small_dict() for o in self.org_units.all().order_by("name")],
        }

    def as_short_dict(self):
        try:
            editable_org_unit_type_ids = self.annotated_editable_org_unit_types_ids
        except AttributeError:
            editable_org_unit_type_ids = [out.pk for out in self.editable_org_unit_types.all()]

        user_roles_editable_org_unit_type_ids = self.get_user_roles_editable_org_unit_type_ids()

        user_infos = self.user
        if hasattr(self.user, "tenant_user") and self.user.tenant_user:
            user_infos = self.user.tenant_user.main_user

        return {
            "id": self.id,
            "first_name": user_infos.first_name,
            "user_name": user_infos.username,
            "last_name": user_infos.last_name,
            "email": user_infos.email,
            "language": self.language,
            "user_id": self.user.id,
            "phone_number": self.phone_number.as_e164 if self.phone_number else None,
            "country_code": region_code_for_number(self.phone_number).lower() if self.phone_number else None,
            "editable_org_unit_type_ids": editable_org_unit_type_ids,
            "user_roles_editable_org_unit_type_ids": user_roles_editable_org_unit_type_ids,
        }

    def has_a_team(self):
        team = self.user.teams.filter(deleted_at=None).first()
        if team:
            return True
        return False

    @cached_property
    def projects_ids(self) -> set[int]:
        """
        Returns the list of project IDs authorized for this profile.

        Note that this is implemented via a `@cached_property` for performance
        reasons. You may have to manually delete it in unit tests, e.g.:

            user.iaso_profile.projects.add(new_project)
            del user.iaso_profile.projects_ids
        """
        return list(self.projects.values_list("pk", flat=True))

    def get_editable_org_unit_type_ids(self) -> set[int]:
        ids_in_user_roles = set(
            self.user_roles.exclude(editable_org_unit_types__isnull=True).values_list(
                "editable_org_unit_types", flat=True
            )
        )
        ids_in_user_profile = set(self.editable_org_unit_types.exclude(id__isnull=True).values_list("id", flat=True))
        return ids_in_user_profile.union(ids_in_user_roles)

    def has_org_unit_write_permission(
        self, org_unit_type_id: int, prefetched_editable_org_unit_type_ids: set[int] = None
    ) -> bool:
        editable_org_unit_type_ids = prefetched_editable_org_unit_type_ids or self.get_editable_org_unit_type_ids()
        if not editable_org_unit_type_ids:
            return True
        return org_unit_type_id in editable_org_unit_type_ids


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


class FeatureFlagQuerySet(models.QuerySet):
    category_order = [
        "DCO",
        "REO",
        "GEO",
        "DAV",
        "ENT",
        "PLA",
        "SPO",
        "NA",
    ]

    def order_by_category_then_order(self):
        category_ordering = Case(
            *[When(category=cat, then=pos) for pos, cat in enumerate(self.category_order)],
            output_field=models.IntegerField(),
        )
        return self.annotate(category_order=category_ordering).order_by("category_order", "order")


class FeatureFlag(models.Model):
    class FeatureFlagCategory(models.TextChoices):
        DATA_COLLECTION_OPTIONS = "DCO", _("Data collection options")
        REFRESH_OPTIONS = "REO", _("Refresh options")
        GEOGRAPHIC_OPTIONS = "GEO", _("Geographic options")
        DATA_VALIDATION = "DAV", _("Data Validation")
        ENTITIES = "ENT", _("Entities")
        PLANNING = "PLA", _("Planning")
        SPECIFIC_OPTIONS = "SPO", _("Specific options")
        NA = "NA", _("Not specified")

    INSTANT_EXPORT = "INSTANT_EXPORT"
    TAKE_GPS_ON_FORM = "TAKE_GPS_ON_FORM"
    REQUIRE_AUTHENTICATION = "REQUIRE_AUTHENTICATION"
    FORMS_AUTO_UPLOAD = "FORMS_AUTO_UPLOAD"
    LIMIT_OU_DOWNLOAD_TO_ROOTS = "LIMIT_OU_DOWNLOAD_TO_ROOTS"
    HOME_OFFLINE = "HOME_OFFLINE"

    FEATURE_FLAGS = {
        (INSTANT_EXPORT, "Instant export", _("Immediate export of instances to DHIS2")),
        (
            TAKE_GPS_ON_FORM,
            "Mobile: take GPS on new form",
            False,
            _("GPS localization on start of instance on mobile"),
        ),
        (
            REQUIRE_AUTHENTICATION,
            "Mobile: authentication required",
            _("Require authentication on mobile"),
        ),
        (
            LIMIT_OU_DOWNLOAD_TO_ROOTS,
            False,
            "Mobile: Limit download of orgunit to what the user has access to",
            _(
                "Mobile: Limit download of orgunit to what the user has access to",
            ),
        ),
        (
            FORMS_AUTO_UPLOAD,
            "",
            False,
            _(
                "Saving a form as finalized on mobile triggers an upload attempt immediately + everytime network becomes available"
            ),
        ),
    }

    code = models.CharField(max_length=100, null=False, blank=False, unique=True)
    name = models.CharField(max_length=100, null=False, blank=False)
    requires_authentication = models.BooleanField(default=False)
    description = models.TextField(blank=True)
    category = models.TextField(choices=FeatureFlagCategory.choices, default=FeatureFlagCategory.NA)
    order = models.PositiveSmallIntegerField(default=0)
    is_dangerous = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    objects = FeatureFlagQuerySet.as_manager()

    def __str__(self):
        return self.name


class BulkCreateUserCsvFile(models.Model):
    file = models.FileField(blank=False, null=False)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, null=True)
    account = models.ForeignKey(Account, on_delete=models.PROTECT, null=True)


class UserRole(models.Model):
    account = models.ForeignKey(Account, on_delete=models.CASCADE)
    group = models.OneToOneField(auth.models.Group, on_delete=models.CASCADE, related_name="iaso_user_role")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Each user can have restricted write access to OrgUnits, based on their type.
    # By default, empty `editable_org_unit_types` means access to everything.
    editable_org_unit_types = models.ManyToManyField(
        "OrgUnitType", related_name="editable_by_user_role_set", blank=True
    )

    def __str__(self) -> str:
        return self.group.name

    def as_short_dict(self):
        return {
            "id": self.id,
            "name": self.remove_user_role_name_prefix(self.group.name),
            "group_id": self.group.id,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    # This method will remove a given prefix from a string
    @staticmethod
    def remove_user_role_name_prefix(str):
        prefix = str.split("_")[0] + "_"
        if str.startswith(prefix):
            return str[len(prefix) :]
        return str

    def as_dict(self):
        return {
            "id": self.id,
            "name": self.remove_user_role_name_prefix(self.group.name),
            "group_id": self.group.id,
            "permissions": list(
                self.group.permissions.filter(codename__startswith="iaso_").values_list("codename", flat=True)
            ),
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
