import pathlib
import typing

from uuid import uuid4

from django.contrib.auth.models import AnonymousUser, User
from django.contrib.postgres.fields import ArrayField
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import models, transaction
from django.db.models import OuterRef, Prefetch, Subquery
from django.utils.html import strip_tags
from django.utils.translation import gettext_lazy as _

from iaso.utils.encryption import calculate_md5

from .. import periods
from ..dhis2.form_mapping import copy_mappings_from_previous_version
from ..odk import parsing
from ..utils import slugify_underscore
from ..utils.models.soft_deletable import (
    DefaultSoftDeletableManager,
    IncludeDeletedSoftDeletableManager,
    OnlyDeletedSoftDeletableManager,
    SoftDeletableModel,
)
from ..utils.virus_scan.model import VirusScanStatus
from .project import Project


CR_MODE_NONE = "CR_MODE_NONE"
CR_MODE_IF_REFERENCE_FORM = "CR_MODE_IF_REFERENCE_FORM"


class FormQuerySet(models.QuerySet):
    def exists_with_same_version_id_within_projects(self, form: "Form", form_id: str):
        """Checks whether the provided form_id is already in a form that is:

        - different from the provided form
        - linked to a project from the same accounts as the provided form
        """

        all_accounts = set(project.account for project in form.projects.all())  # TODO: discuss - smells weird
        for account in all_accounts:
            if self.filter(projects__account=account, form_id=form_id).exclude(pk=form.id).exists():
                return True

        return False

    def filter_for_user_and_app_id(self, user: typing.Union[User, AnonymousUser], app_id: typing.Optional[str] = None):
        if user.is_anonymous and app_id is None:
            return self.none()

        queryset = self.all()

        if user.is_authenticated:
            queryset = queryset.filter(projects__account=user.iaso_profile.account)

        if app_id is not None:  # mobile app
            try:
                project = Project.objects.get_for_user_and_app_id(user, app_id)
                queryset = queryset.filter(projects__in=[project])
                queryset = queryset.exclude(derived=True)  # do not include derived instances for the mobile app
            except Project.DoesNotExist:
                return self.none()

        return queryset

    def with_latest_version(self):
        queryset = self
        queryset = queryset.annotate(
            latest_version_id=Subquery(
                FormVersion.objects.filter(form=OuterRef("pk")).order_by("-created_at").values("id")[:1]
            )
        )

        latest_versions = FormVersion.objects.filter(id__in=queryset.values_list("latest_version_id", flat=True))

        queryset = queryset.prefetch_related(
            Prefetch("form_versions", queryset=latest_versions, to_attr="latest_versions")
        )
        return queryset

    def filter_on_user_projects(self, user: User) -> models.QuerySet:
        if not hasattr(user, "iaso_profile"):
            return self
        user_projects_ids = user.iaso_profile.projects_ids
        if not user_projects_ids:
            return self
        return self.filter(projects__in=user_projects_ids)


class Form(SoftDeletableModel):
    """Metadata about a form

    Forms are versioned, see the FormVersion model
    """

    PERIOD_TYPE_CHOICES = (
        (periods.PERIOD_TYPE_DAY, _("Day")),
        (periods.PERIOD_TYPE_MONTH, _("Month")),
        (periods.PERIOD_TYPE_QUARTER, _("Quarter")),
        (periods.PERIOD_TYPE_QUARTER_NOV, _("Quarter Nov")),
        (periods.PERIOD_TYPE_SIX_MONTH, _("Six-month")),
        (periods.PERIOD_TYPE_YEAR, _("Year")),
        (periods.PERIOD_TYPE_FINANCIAL_NOV, _("Financial Nov")),
    )

    CHANGE_REQUEST_MODE = (
        (CR_MODE_NONE, _("No change request")),
        (CR_MODE_IF_REFERENCE_FORM, _("Create change request if form is reference form")),
    )

    org_unit_types = models.ManyToManyField("OrgUnitType", blank=True)
    form_id = models.TextField(null=True, blank=True)  # extracted from version xls file
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.TextField()
    device_field = models.TextField(null=True, blank=True)
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
    period_type = models.TextField(null=True, blank=True, choices=PERIOD_TYPE_CHOICES)
    single_per_period = models.BooleanField(default=False)
    # The following two fields control the allowed period span (instances can be provided for the period corresponding
    # to [current_period - periods_before_allowed, current_period + periods_after_allowed]
    periods_before_allowed = models.IntegerField(default=0, null=True)
    periods_after_allowed = models.IntegerField(default=0, null=True)
    # True if the data is generated by iaso or  False via data entry in mobile
    derived = models.BooleanField(default=False)
    uuid = models.UUIDField(default=uuid4, unique=True)
    label_keys = ArrayField(
        models.CharField(max_length=255, blank=True, db_collation="case_insensitive"), size=100, null=True, blank=True
    )

    objects = DefaultSoftDeletableManager.from_queryset(FormQuerySet)()

    objects_only_deleted = OnlyDeletedSoftDeletableManager.from_queryset(FormQuerySet)()

    objects_include_deleted = IncludeDeletedSoftDeletableManager.from_queryset(FormQuerySet)()

    legend_threshold = models.JSONField(blank=True, null=True)

    change_request_mode = models.TextField(choices=CHANGE_REQUEST_MODE, default=CR_MODE_NONE)

    @property
    def latest_version(self):
        # attribute filled by queryset.with_latest_version() on FormQuerySet
        try:
            if len(self.latest_versions) > 0:
                return self.latest_versions[0]
            return None
        except AttributeError as e:
            # WARN form loaded without approtiate queryset.with_latest_version(), might trigger n+1 select
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
            "label_keys": self.label_keys,
        }

        if show_version:
            res["latest_form_version"] = self.latest_version.as_dict() if self.latest_version is not None else None
        if additional_fields:
            for field in additional_fields:
                if hasattr(self, field):
                    res[field] = getattr(self, field)

        return res

    def as_minimal_dict(self):
        return {
            "name": self.name,
            "id": self.id,
        }

    def update_possible_fields(self: "Form"):
        """Keep accumulated list of all the flat fields that were present at some point in a version of the form.
        This is used to build a table view of the form answers without having to parse the xml files

        This need to be called when a new form version is added
        """
        # proceed from the oldest to the newest so we take newest labels
        all_questions = {}
        for form_version in self.form_versions.order_by("created_at"):
            # proceed from the oldest to the newest so we take newest labels
            questions = form_version.questions_by_name()
            if isinstance(questions, dict):
                all_questions.update(questions)
            else:
                print(f"Invalid questions on version {form_version}: {str(questions)[:50]}")
        self.possible_fields = _reformat_questions(all_questions)


def _form_version_upload_to(instance: "FormVersion", filename: str) -> str:
    path = pathlib.Path(filename)
    underscored_form_name = slugify_underscore(instance.form.name)

    return f"forms/{underscored_form_name}_{instance.version_id}{path.suffix}"


class FormVersionQuerySet(models.QuerySet):
    def latest_version(self, form: Form) -> "typing.Optional[FormVersion]":
        try:
            return self.filter(form=form).latest("created_at")
        except FormVersion.DoesNotExist:
            return None


def _reformat_questions(questions):
    """Return all questions as a list instead of dict
    remove fields of type 'note'
    keep only fields : name, label, type.
    label can contain html, to prevent injection and make them presentable in list we strip the tags
    """
    r = []

    for question in questions.values():
        question_type = question.get("type")

        if question_type == "note":
            continue

        n = {
            "name": question["name"],
            "label": strip_tags(question["label"]) if "label" in question else "",
            "type": question_type,
        }
        r.append(n)
    return r


# TODO: check if we really need a manager and a queryset for this model - some simplification would be good
class FormVersionManager(models.Manager):
    def create_for_form_and_survey(self, *, form: "Form", survey: parsing.Survey, **kwargs):
        with transaction.atomic():
            latest_version = self.latest_version(form)  # type: ignore
            file = SimpleUploadedFile(survey.generate_file_name("xml"), survey.to_xml(), content_type="text/xml")
            form_version = super().create(
                **kwargs,
                form=form,
                file=file,
                md5=calculate_md5(file),
                version_id=survey.version,
                form_descriptor=survey.to_json(),
            )
            form.form_id = survey.form_id
            form.update_possible_fields()
            form.save()

            if latest_version is not None:
                copy_mappings_from_previous_version(form_version, latest_version)

        return form_version


class FormVersion(models.Model):
    """A version of a Form

    The actual form definition (list of questions and their presentation) are kept in files (file/xls_file attribute)
    """

    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name="form_versions")
    # xml file representation
    file = models.FileField(upload_to=_form_version_upload_to)
    md5 = models.CharField(blank=True, max_length=32)
    xls_file = models.FileField(upload_to=_form_version_upload_to, null=True, blank=True)
    form_descriptor = models.JSONField(null=True, blank=True)
    version_id = models.TextField()  # extracted from xls
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    start_period = models.TextField(blank=True, null=True)
    end_period = models.TextField(blank=True, null=True)
    possible_fields = models.JSONField(
        null=True,
        blank=True,
        help_text="Questions present in this form version, as a flat list."
        "Update on save. See equivalent on Form for all version",
        editable=False,
    )

    objects = FormVersionManager.from_queryset(FormVersionQuerySet)()

    def get_or_save_form_descriptor(self):  # TODO: remove me - should be populated on create
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

    def repeat_groups(self):
        questions = self.questions_by_name()
        repeats = []
        for key, value in questions.items():
            if value["type"] == "repeat":
                repeats.append(value)

        return repeats

    def questions_by_path(self):
        return parsing.to_questions_by_path(self.get_or_save_form_descriptor())

    def as_dict(self):
        return {
            "id": self.id,
            "version_id": self.version_id,
            "file": self.file.url,
            "xls_file": self.xls_file.url if self.xls_file else None,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
        }

    def __str__(self):
        return "%s - %s - %s" % (self.form.name, self.version_id, self.created_at)


def update_possible_fields(sender, instance, **kwargs):
    if not instance.form_descriptor and instance.xls_file:
        json_survey = parsing.to_json_dict(instance)
        instance.form_descriptor = json_survey
    questions = instance.questions_by_path()
    instance.possible_fields = _reformat_questions(questions)


models.signals.pre_save.connect(update_possible_fields, sender=FormVersion)


class FormPredefinedFilter(models.Model):
    """A Predefined filter allows to add quick filters in the UI to surface some instance which needs attention.

    The predefined filters rely on the form's possible fields.
    The json_logic must return a boolean.
    """

    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name="predefined_filters")
    name = models.TextField(null=False, blank=False)
    short_name = models.CharField(null=False, blank=False, max_length=25)
    json_logic = models.JSONField(null=False, blank=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class FormAttachment(models.Model):
    """ODK supports attaching files to form in order to display/play media or attach external data sources.

    This is the representation of those attachments within Iaso.
    """

    class Meta:
        unique_together = [["form", "name"]]

    def form_folder(self, filename):
        return "/".join(["form_attachments", str(self.form.id), filename])

    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name="attachments")
    name = models.TextField(null=False, blank=False)
    file = models.FileField(upload_to=form_folder)
    file_last_scan = models.DateTimeField(blank=True, null=True)
    file_scan_status = models.CharField(max_length=10, choices=VirusScanStatus.choices, default=VirusScanStatus.PENDING)
    md5 = models.CharField(null=False, blank=False, max_length=32)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
