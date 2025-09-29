import operator
import os
import random
import re
import time
import typing

from functools import reduce
from io import StringIO
from logging import getLogger
from urllib.error import HTTPError
from urllib.request import urlopen

import django_cte

from bs4 import BeautifulSoup as Soup  # type: ignore
from django.contrib.auth.models import User
from django.contrib.gis.db.models.fields import PointField
from django.contrib.gis.geos import Point
from django.contrib.postgres.aggregates import ArrayAgg
from django.core.exceptions import ObjectDoesNotExist, ValidationError
from django.core.paginator import Paginator
from django.db import models
from django.db.models import Count, Exists, F, FilteredRelation, Func, OuterRef, Q
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from iaso.utils import extract_form_version_id, flat_parse_xml_soup
from iaso.utils.emoji import fix_emoji
from iaso.utils.file_utils import get_file_type
from iaso.utils.jsonlogic import instance_jsonlogic_to_q
from iaso.utils.models.upload_to import get_account_name_based_on_user

from ..utils.dhis2 import generate_id_for_dhis_2
from .device import Device, DeviceOwnership
from .forms import Form, FormVersion
from .org_unit import OrgUnit, OrgUnitReferenceInstance


logger = getLogger(__name__)
from iaso.utils.dates import get_beginning_of_day, get_end_of_day


def instance_upload_to(instance: "Instance", filename: str):
    today = timezone.now().date()
    year_month = today.strftime("%Y_%m")
    account_name = get_account_name_based_on_user(instance.created_by)

    return os.path.join(
        account_name,
        "instances",
        year_month,
        filename,
    )


def instance_file_upload_to(instance_file: "InstanceFile", filename: str):
    today = timezone.now().date()
    year_month = today.strftime("%Y_%m")
    user = getattr(instance_file.instance, "created_by", None)
    account_name = get_account_name_based_on_user(user)

    return os.path.join(
        account_name,
        "instance_files",
        year_month,
        filename,
    )


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
        created_from=None,
        created_to=None,
        show_deleted=None,
        entity_id=None,
        user_ids=None,
        modification_from=None,
        modification_to=None,
        sent_from=None,
        sent_to=None,
        json_content=None,
        planning_ids=None,
        project_ids=None,
        only_reference=None,
    ):
        queryset = self

        if created_from or created_to:
            queryset = queryset.annotate(creation_timestamp=Coalesce("source_created_at", "created_at"))
            if created_from:
                created_from_ts = get_beginning_of_day(created_from)
                queryset = queryset.filter(creation_timestamp__gte=created_from_ts)
            if created_to:
                created_from_ts = get_end_of_day(created_to)
                queryset = queryset.filter(creation_timestamp__lte=created_from_ts)

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

        if only_reference == "true":
            if org_unit_id:
                # Create a subquery for OrgUnitReferenceInstance that checks for matching org_unit_id and instance_id
                subquery = OrgUnitReferenceInstance.objects.filter(org_unit_id=org_unit_id, instance_id=OuterRef("pk"))
                queryset = queryset.annotate(has_reference=Exists(subquery)).filter(has_reference=True)
            else:
                # If no specific org_unit_id is provided, check for any OrgUnitReferenceInstance matching the instance_id
                subquery = OrgUnitReferenceInstance.objects.filter(instance_id=OuterRef("pk"))
                queryset = queryset.annotate(has_reference=Exists(subquery)).filter(has_reference=True)
        else:
            if org_unit_id:
                # Filter by org unit id if only_reference is not true
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

        if planning_ids:
            queryset = queryset.filter(planning_id__in=planning_ids.split(","))

        if project_ids:
            queryset = queryset.filter(project_id__in=project_ids.split(","))

        if search:
            if search.startswith("ids:"):
                ids_str = search.replace("ids:", "")
                try:
                    ids = re.findall("[A-Za-z0-9_-]+", ids_str)
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

        if modification_from:
            queryset = queryset.filter(updated_at__gte=get_beginning_of_day(modification_from))
        if modification_to:
            queryset = queryset.filter(updated_at__lte=get_end_of_day(modification_to))

        if sent_from:
            queryset = queryset.filter(created_at__gte=get_beginning_of_day(sent_from))
        if sent_to:
            queryset = queryset.filter(created_at__lte=get_end_of_day(sent_to))

        if status:
            statuses = status.split(",")
            queryset = queryset.filter(status__in=statuses)

        if user_ids:
            queryset = queryset.filter(created_by__id__in=user_ids.split(","))

        if json_content:
            q = instance_jsonlogic_to_q(jsonlogic=json_content, field_prefix="json__")
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

    def filter_on_user_projects(self, user: User) -> models.QuerySet:
        if not hasattr(user, "iaso_profile"):
            return self
        user_projects_ids = user.iaso_profile.projects_ids
        if not user_projects_ids:
            return self
        return self.filter(project__in=user_projects_ids)


class NonDeletedInstanceManager(models.Manager):
    def get_queryset(self):
        """
        Exclude soft deleted instances from all results.
        """
        return super().get_queryset().filter(deleted=False)


# to keep the export code "simple"
# this mock task will be passed when the export is happening outside async task framework
# see iaso/tests/api/test_enketo.py
class InMemoryTask:
    def __init__(self):
        self.progress_message = ""
        self.error = None
        self.has_error = False
        self.exception = None

    def stop_if_killed(self):
        pass

    def report_progress_and_stop_if_killed(
        self, progress_value=None, progress_message=None, end_value=None, prepend_progress=False
    ):
        pass

    def report_success_with_result(self, message=None, result_data=None):
        pass

    def terminate_with_error(self, message=None, exception=None):
        logger.warn(f"InMemoryTask {self} ended in error", message, exception)
        self.error = message
        self.has_error = True
        self.exception = exception

    def refresh_from_db(self):
        pass


class Instance(models.Model):
    """A series of answers by an individual for a specific form

    Note that instances are called "Submissions" in the UI
    """

    STATUS_READY = "READY"
    STATUS_DUPLICATED = "DUPLICATED"
    STATUS_EXPORTED = "EXPORTED"
    STATUSES = [STATUS_READY, STATUS_DUPLICATED, STATUS_EXPORTED]

    ALWAYS_ALLOWED_PATHS_XML = set(
        ["formhub", "formhub/uuid", "meta", "meta/instanceID", "meta/editUserID", "meta/deprecatedID"]
    )

    REFERENCE_FLAG_CODE = "flag"
    REFERENCE_UNFLAG_CODE = "unflag"

    # Previously created_at and update_at were filled by the mobile, now they
    # have been replaced by `source_created_at` and `update_created_at`.
    # Columns `created_at` and `update_at` are set by Django per usual.
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    source_created_at = models.DateTimeField(null=True, blank=True, help_text="Creation time on the device")
    created_by = models.ForeignKey(User, on_delete=models.PROTECT, blank=True, null=True)
    last_modified_by = models.ForeignKey(
        User, on_delete=models.PROTECT, blank=True, null=True, related_name="last_modified_by"
    )
    updated_at = models.DateTimeField(auto_now=True, editable=False)
    source_updated_at = models.DateTimeField(null=True, blank=True, help_text="Update time on the device")
    uuid = models.TextField(null=True, blank=True)
    export_id = models.TextField(null=True, blank=True, default=generate_id_for_dhis_2)
    correlation_id = models.BigIntegerField(null=True, blank=True)
    name = models.TextField(null=True, blank=True)  # form.name
    file = models.FileField(upload_to=instance_upload_to, null=True, blank=True)
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
    planning = models.ForeignKey("Planning", null=True, blank=True, on_delete=models.SET_NULL, related_name="instances")
    form_version = models.ForeignKey(
        "FormVersion", null=True, blank=True, on_delete=models.DO_NOTHING, related_name="form_version"
    )

    last_export_success_at = models.DateTimeField(null=True, blank=True)

    objects = models.Manager.from_queryset(InstanceQuerySet)()
    non_deleted_objects = NonDeletedInstanceManager.from_queryset(InstanceQuerySet)()

    # Is instance SoftDeleted. It doesn't use the SoftDeleteModel deleted_at like the rest for historical reason.
    deleted = models.BooleanField(default=False)
    # See public_create_url workflow in enketo/README.md. used to tell we should export immediately
    to_export = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["updated_at"]),
            models.Index(fields=["source_created_at"]),
            models.Index(fields=["source_updated_at"]),
        ]

    def __str__(self):
        return "%s %s %s" % (self.id, self.form, self.name)

    @property
    def is_instance_of_reference_form(self) -> bool:
        if not self.org_unit or not self.org_unit.org_unit_type:
            return False
        return self.org_unit.org_unit_type.reference_forms.filter(id=self.form_id).exists()

    @property
    def is_reference_instance(self) -> bool:
        if not self.org_unit:
            return False
        return self.org_unit.reference_instances.filter(orgunitreferenceinstance__instance=self).exists()

    @property
    def source_created_at_with_fallback(self):
        return self.source_created_at if self.source_created_at else self.created_at

    @property
    def source_updated_at_with_fallback(self):
        return self.source_updated_at if self.source_updated_at else self.updated_at

    def flag_reference_instance(self, org_unit: "OrgUnit") -> "OrgUnitReferenceInstance":
        if not self.form:
            raise ValidationError(_("The Instance must be linked to a Form."))
        if not org_unit.org_unit_type:
            raise ValidationError(_("The OrgUnit must be linked to a OrgUnitType."))
        if not org_unit.org_unit_type.reference_forms.filter(id=self.form_id).exists():
            raise ValidationError(_("The submission must be an instance of a reference form."))
        kwargs = {"org_unit": org_unit, "form_id": self.form_id}
        # Delete the previous flag for this pair of org_unit/form.
        OrgUnitReferenceInstance.objects.filter(**kwargs).delete()
        # Flag the new one.
        return OrgUnitReferenceInstance.objects.create(instance=self, **kwargs)

    def unflag_reference_instance(self, org_unit: "OrgUnit") -> None:
        org_unit.reference_instances.remove(self)

    # Used by Django Admin to link to the submission page in the dashboard
    def get_absolute_url(self):
        return f"/dashboard/forms/submission/instanceId/{self.pk}"

    def convert_location_from_field(self, field_name=None):
        f = field_name
        if f is None:
            f = self.form.location_field
            location = self.json.get(f, None)
            if location:
                coords = [float(x) for x in location.split(" ")]
                latitude, longitude, altitude = coords[:3]
                self.location = Point(x=longitude, y=latitude, z=altitude, srid=4326)
                self.accuracy = coords[3] if len(coords) > 3 else None
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
            if self.form.correlation_field and self.json:
                identifier += self.json.get(self.form.correlation_field, None)
                identifier = identifier.zfill(3)
            random_number = random.choice("1234567890")
            value = int(identifier + random_number)
            suffix = f"{value % 97:02d}"
            self.correlation_id = identifier + random_number + suffix
            self.save()

    def xml_file_to_json(self, file: typing.IO) -> typing.Dict[str, typing.Any]:
        raw_content = file.read().decode("utf-8")
        fixed_content = fix_emoji(raw_content).decode("utf-8")
        copy_io_utf8 = StringIO(fixed_content)
        soup = Soup(copy_io_utf8, "lxml-xml", from_encoding="utf-8")

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
            # warn old form, but keep it working ? or throw error
            return flat_parse_xml_soup(soup, [], None)["flat_json"]
        return flat_parse_xml_soup(soup, [], None)["flat_json"]

    def get_and_save_json_of_xml(self, force=False, tries=3):
        """
        Convert the xml file to json and save it to the instance.
        If the instance already has a json, don't do anything unless `force=True`.

        When downloading from S3, attempt `tries` times (3 by default) with
        exponential backoff.

        :return: in all cases, return the JSON representation of the instance
        """
        if self.json and not force:
            # already converted, we can use this one
            return self.json
        if self.file:
            # not converted yet, but we have a file, so we can convert it
            if "amazonaws" in self.file.url:
                for i in range(tries):
                    try:
                        file = urlopen(self.file.url)
                        break
                    except HTTPError as err:
                        if err.code == 503:  # Slow Down
                            time.sleep(2**i)
                        else:
                            raise err

            else:
                file = self.file

            self.json = self.xml_file_to_json(file)
            self.save()
            return self.json
        # no file, no json, when/why does this happen?
        return {}

    def get_form_version(self):
        json = self.get_and_save_json_of_xml()

        try:
            return self.form.form_versions.get(version_id=json["_version"])
        except (KeyError, FormVersion.DoesNotExist):
            return None

    def export(self, launcher=None, force_export=False):
        from iaso.dhis2.datavalue_exporter import DataValueExporter, InstanceExportError
        from iaso.dhis2.export_request_builder import ExportRequestBuilder, NothingToExportError

        try:
            export_request = ExportRequestBuilder().build_export_request(
                filters={"instance_id": self.id},
                launcher=launcher,
                force_export=force_export,
            )
            task = InMemoryTask()
            DataValueExporter().export_instances(export_request, task)
            self.refresh_from_db()
            if task.has_error:
                raise InstanceExportError(str(task.error), {}, [task.error])
        except NothingToExportError:
            print("Export failed for instance", self)

    def as_dict(self):
        file_content = self.get_and_save_json_of_xml()
        last_modified_by = None

        if self.last_modified_by is not None:
            last_modified_by = self.last_modified_by.username

        return {
            "uuid": self.uuid,
            "export_id": self.export_id,
            "file_name": self.file_name,
            "file_content": file_content,
            "file_url": self.file.url if self.file else None,
            "id": self.id,
            "form_id": self.form_id,
            "form_name": self.form.name if self.form else None,
            "created_at": self.created_at.timestamp(),
            "updated_at": self.updated_at.timestamp(),
            "source_created_at": self.source_created_at.timestamp() if self.source_created_at else None,
            "source_updated_at": self.source_updated_at.timestamp() if self.source_updated_at else None,
            "org_unit": self.org_unit.as_dict() if self.org_unit else None,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "period": self.period,
            "project_name": self.project.name if self.project else None,
            "project_color": self.project.color if self.project else None,
            "project_id": self.project.id if self.project else None,
            "status": getattr(self, "status", None),
            "correlation_id": self.correlation_id,
            "created_by": (
                {
                    "username": self.created_by.username,
                    "first_name": self.created_by.first_name,
                    "last_name": self.created_by.last_name,
                }
                if self.created_by
                else None
            ),
            "last_modified_by": last_modified_by,
        }

    def as_dict_with_descriptor(self):
        dict = self.as_dict()
        form_version = self.get_form_version()
        dict["form_descriptor"] = form_version.get_or_save_form_descriptor() if form_version is not None else None
        return dict

    def as_full_model(self, with_entity=False):
        file_content = self.get_and_save_json_of_xml()
        form_version = self.get_form_version()

        last_modified_by = None
        if self.last_modified_by is not None:
            last_modified_by = self.last_modified_by.username

        result = {
            "uuid": self.uuid,
            "last_modified_by": last_modified_by,
            "modification": True,
            "id": self.id,
            "device_id": self.device.imei if self.device else None,
            "file_name": self.file_name,
            "file_url": self.file.url if self.file else None,
            "form_id": self.form_id,
            "form_version_id": self.form_version.id if self.form_version else None,
            "form_name": self.form.name,
            "form_descriptor": form_version.get_or_save_form_descriptor() if form_version is not None else None,
            "created_at": self.created_at.timestamp(),
            "updated_at": self.updated_at.timestamp(),
            "source_created_at": self.source_created_at.timestamp() if self.source_created_at else None,
            "source_updated_at": self.source_updated_at.timestamp() if self.source_updated_at else None,
            "org_unit": self.org_unit.as_dict_with_parents(light=False, light_parents=False) if self.org_unit else None,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "accuracy": self.accuracy,
            "period": self.period,
            "planning_id": self.planning.id if self.planning else None,
            "planning_name": self.planning.name if self.planning else None,
            "team_id": self.planning.team_id if self.planning else None,
            "file_content": file_content,
            "files": [f.file.url if f.file else None for f in self.instancefile_set.filter(deleted=False)],
            "status": getattr(self, "status", None),
            "correlation_id": self.correlation_id,
            "last_export_success_at": self.last_export_success_at.timestamp() if self.last_export_success_at else None,
            "export_id": self.export_id,
            "export_statuses": [
                {
                    "status": export_status.status,
                    "created_at": export_status.created_at.timestamp() if export_status.created_at else None,
                    "export_request": {
                        "launcher": {
                            "full_name": (
                                export_status.export_request.launcher.get_full_name()
                                if export_status.export_request.launcher
                                else "AUTO UPLOAD"
                            ),
                            "email": (
                                export_status.export_request.launcher.email
                                if export_status.export_request.launcher
                                else "AUTO UPLOAD"
                            ),
                        },
                        "last_error_message": f"{export_status.last_error_message}, {export_status.export_request.last_error_message}",
                    },
                }
                for export_status in Paginator(self.exportstatus_set.order_by("-id"), 3).object_list
            ],
            "deleted": self.deleted,
            "created_by": (
                {
                    "username": self.created_by.username,
                    "first_name": self.created_by.first_name,
                    "last_name": self.created_by.last_name,
                }
                if self.created_by
                else None
            ),
        }

        result["change_requests"] = self.get_instance_change_requests_data()

        if with_entity and self.entity_id:
            result["entity"] = self.entity.as_small_dict_with_nfc_cards(self)

        return result

    def get_instance_change_requests_data(self):
        from iaso.api.org_unit_change_requests.serializers import OrgUnitChangeRequestListSerializer

        org_unit_change_requests = self.orgunitchangerequest_set.all()
        serializer = OrgUnitChangeRequestListSerializer(org_unit_change_requests, many=True)

        return serializer.data

    def as_small_dict(self):
        return {
            "id": self.id,
            "file_url": self.file.url if self.file else None,
            "created_at": self.source_created_at_with_fallback.timestamp(),
            "updated_at": self.source_updated_at_with_fallback.timestamp(),
            "period": self.period,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "accuracy": self.accuracy,
            "files": [f.file.url if f.file else None for f in self.instancefile_set.filter(deleted=False)],
            "status": getattr(self, "status", None),
            "correlation_id": self.correlation_id,
        }

    def soft_delete(self):
        self.deleted = True
        self.save()

    def restore(self):
        self.deleted = False
        self.save()

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

    def save(self, *args, **kwargs):
        if self.json is not None and self.json.get("_version"):
            try:
                form_version = FormVersion.objects.get(version_id=self.json.get("_version"), form_id=self.form.id)
                self.form_version = form_version
            except ObjectDoesNotExist:
                pass
        return super(Instance, self).save(*args, **kwargs)


class InstanceFileExtensionQuerySet(models.QuerySet):
    def filter_image(self):
        return self.filter(annotated_file_extension__in=self.model.IMAGE_EXTENSIONS)

    def filter_video(self):
        return self.filter(annotated_file_extension__in=self.model.VIDEO_EXTENSIONS)

    def filter_document(self):
        return self.filter(annotated_file_extension__in=self.model.DOCUMENT_EXTENSIONS)

    def filter_other(self):
        return self.filter(
            ~Q(
                annotated_file_extension__in=self.model.IMAGE_EXTENSIONS
                + self.model.VIDEO_EXTENSIONS
                + self.model.DOCUMENT_EXTENSIONS
            )
        )

    def filter_by_file_types(self, image=False, video=False, document=False, other=False):
        """Apply file type filters with OR logic when multiple filters are active"""
        queryset = self

        # Build OR conditions for active filters
        conditions = []

        if image:
            conditions.append(Q(annotated_file_extension__in=self.model.IMAGE_EXTENSIONS))

        if video:
            conditions.append(Q(annotated_file_extension__in=self.model.VIDEO_EXTENSIONS))

        if document:
            conditions.append(Q(annotated_file_extension__in=self.model.DOCUMENT_EXTENSIONS))

        if other:
            conditions.append(
                ~Q(
                    annotated_file_extension__in=self.model.IMAGE_EXTENSIONS
                    + self.model.VIDEO_EXTENSIONS
                    + self.model.DOCUMENT_EXTENSIONS
                )
            )

        # Apply OR logic if multiple conditions exist
        if len(conditions) > 1:
            combined_condition = conditions[0]
            for condition in conditions[1:]:
                combined_condition |= condition
            queryset = queryset.filter(combined_condition)
        elif len(conditions) == 1:
            queryset = queryset.filter(conditions[0])

        return queryset


class InstanceFileExtensionManager(models.Manager):
    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .annotate(
                annotated_file_extension=Func(
                    F("file"), function="LOWER", template="SUBSTRING(%(expressions)s, '\.([^\.]+)$')"
                )
            )
        )


class InstanceFile(models.Model):
    #  According to frontend, we need to filter by file extension, see hat/assets/js/apps/Iaso/utils/filesUtils.ts
    IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "gif", "bmp", "tiff", "webp"]
    VIDEO_EXTENSIONS = ["mp4", "mov"]
    DOCUMENT_EXTENSIONS = ["pdf", "doc", "docx", "xls", "xlsx", "csv", "txt"]

    instance = models.ForeignKey(Instance, on_delete=models.DO_NOTHING, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    name = models.TextField(null=True, blank=True)
    file = models.FileField(upload_to=instance_file_upload_to, null=True, blank=True)
    deleted = models.BooleanField(default=False)

    objects = models.Manager()
    objects_with_file_extensions = InstanceFileExtensionManager.from_queryset(InstanceFileExtensionQuerySet)()

    def __str__(self):
        return "%s " % (self.name,)

    def as_dict(self):
        return {
            "id": self.id,
            "instance_id": self.instance_id,
            "file": self.file.url if self.file else None,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "file_type": get_file_type(self.file),
        }


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
