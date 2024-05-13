import json
import operator
import typing
import uuid
from copy import deepcopy
from functools import reduce

import django_cte
from django.contrib.auth.models import AnonymousUser, User
from django.contrib.gis.db.models.fields import MultiPolygonField, PointField
from django.contrib.postgres.fields import ArrayField
from django.contrib.postgres.indexes import GinIndex, GistIndex
from django.core.exceptions import ValidationError
from django.db import models, transaction
from django.db.models import Q, QuerySet
from django.db.models.expressions import RawSQL
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django_ltree.fields import PathField  # type: ignore
from django_ltree.models import TreeModel  # type: ignore

from hat.audit.models import ORG_UNIT_CHANGE_REQUEST, log_modification
from iaso.models.data_source import SourceVersion

from ..utils.expressions import ArraySubquery
from ..utils.models.common import get_creator_name
from .project import Project

try:  # for typing
    from .base import Account, Instance
except:
    pass


def get_or_create_org_unit_type(name: str, depth: int, account: "Account", preferred_project: Project) -> "OrgUnitType":
    """
    Get or create the OUT (in the scope of the account).

    OUT are considered identical if they have the same name, depth and account.

    Since the existing data is messy (sometimes there are multiple similar OUT in a given account) we are trying to be
    smart but careful here: we first try to find an existing OUT for the preferred project, if not we look for another
    one in the account, if not we create a new one.

    :raises ValueError: if the preferred_project account is not consistent with the account parameter
    """

    if preferred_project.account != account:
        raise ValueError("preferred_project.account and account parameters are inconsistent")

    out_defining_fields = {"name": name, "depth": depth}

    try:
        # Let's first try to find a single entry for the preferred project
        return OrgUnitType.objects.get(**out_defining_fields, projects=preferred_project)
    except OrgUnitType.DoesNotExist:
        # Nothing for the preferred project, let's try to find one in the account
        all_projects_from_account = Project.objects.filter(account=preferred_project.account)
        try:
            # Maybe we have a single entry for the account?
            return OrgUnitType.objects.get(**out_defining_fields, projects__in=all_projects_from_account)
        except OrgUnitType.MultipleObjectsReturned:
            # We have multiple similar OUT in the account and no way to choose the better one, so let's pick the first
            return OrgUnitType.objects.filter(**out_defining_fields, projects__in=all_projects_from_account).first()  # type: ignore
        except OrgUnitType.DoesNotExist:
            # We have no similar OUT in the account, so let's create a new one
            return OrgUnitType.objects.create(**out_defining_fields, short_name=name[:4])
    except OrgUnitType.MultipleObjectsReturned:
        # We have multiple similar OUT for the preferred project, so let's pick the first
        return OrgUnitType.objects.filter(**out_defining_fields, projects=preferred_project).first()  # type: ignore


class OrgUnitTypeQuerySet(models.QuerySet):
    def countries(self):
        return self.filter(category="COUNTRY")

    def filter_for_user_and_app_id(
        self, user: typing.Union[User, AnonymousUser, None], app_id: typing.Optional[str] = None
    ):
        if user and user.is_anonymous and app_id is None:
            return self.none()

        queryset = self.prefetch_related(
            "projects",
            "projects__account",
            "projects__feature_flags",
            "allow_creating_sub_unit_types",
            "reference_forms",
            "sub_unit_types",
        )

        if user and user.is_authenticated:
            queryset = queryset.filter(projects__account=user.iaso_profile.account)

        if app_id is not None:
            try:
                project = Project.objects.get_for_user_and_app_id(user, app_id)
                queryset = queryset.filter(projects__in=[project])
            except Project.DoesNotExist:
                return self.none()

        return queryset


OrgUnitTypeManager = models.Manager.from_queryset(OrgUnitTypeQuerySet)


class OrgUnitType(models.Model):
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
    reference_forms = models.ManyToManyField("Form", related_name="reference_of_org_unit_types", blank=True)
    projects = models.ManyToManyField("Project", related_name="unit_types", blank=False)
    depth = models.PositiveSmallIntegerField(null=True, blank=True)

    objects = OrgUnitTypeManager()

    def __str__(self):
        return "%s" % self.name

    def as_dict(self, sub_units=True, app_id=None):
        res = {
            "id": self.id,
            "name": self.name,
            "short_name": self.short_name,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "depth": self.depth,
        }
        if sub_units:
            if not app_id:
                sub_unit_types = [unit.as_dict(sub_units=False) for unit in self.sub_unit_types.all()]
            else:
                sub_unit_types = [
                    unit.as_dict(sub_units=False) for unit in self.sub_unit_types.filter(projects__app_id=app_id)
                ]
            res["sub_unit_types"] = sub_unit_types
        return res

    def as_minimal_dict(self):
        return {
            "name": self.name,
            "id": self.id,
        }


# noinspection PyTypeChecker
class OrgUnitQuerySet(django_cte.CTEQuerySet):
    def children(self, org_unit: "OrgUnit") -> "OrgUnitQuerySet":
        """Only the direct descendants"""
        # We need to cast PathValue instances to strings - this could be fixed upstream
        # (https://github.com/mariocesar/django-ltree/issues/8)
        return self.filter(path__descendants=str(org_unit.path), path__depth=len(org_unit.path) + 1)

    def hierarchy(
        self, org_unit: typing.Union[typing.List["OrgUnit"], "QuerySet[OrgUnit]", "OrgUnit"]
    ) -> "OrgUnitQuerySet":
        """The OrgunitS and all their descendants"""
        # We need to cast PathValue instances to strings - this could be fixed upstream
        # (https://github.com/mariocesar/django-ltree/issues/8)
        if isinstance(org_unit, OrgUnit):
            query = models.Q(path__descendants=str(org_unit.path))
        elif isinstance(org_unit, models.QuerySet):
            org_unit_qs = org_unit
            query = models.Q(path__descendants=ArraySubquery(org_unit_qs.values("path")))
        elif isinstance(org_unit, (list,)):
            org_unit = org_unit.only("path") if isinstance(org_unit, models.QuerySet) else org_unit
            query = reduce(operator.or_, [models.Q(path__descendants=str(ou.path)) for ou in list(org_unit)])

        return self.filter(query)

    def descendants(self, org_unit: "OrgUnit") -> "OrgUnitQuerySet":
        """All the descendent, org unit or not"""
        # We need to cast PathValue instances to strings - this could be fixed upstream
        # (https://github.com/mariocesar/django-ltree/issues/8)
        return self.filter(path__descendants=str(org_unit.path), path__depth__gt=len(org_unit.path))

    def query_for_related_org_units(self, org_units):
        ltree_list = ", ".join(list(map(lambda org_unit: f"'{org_unit.pk}'::ltree", org_units)))

        return RawSQL(f"array[{ltree_list}]", []) if len(ltree_list) > 0 else ""

    def filter_for_user(self, user):
        return self.filter_for_user_and_app_id(user, None)

    def filter_for_user_and_app_id(
        self, user: typing.Union[User, AnonymousUser, None], app_id: typing.Optional[str] = None
    ) -> "OrgUnitQuerySet":
        """Restrict to the orgunits the User can see, used mainly in the API"""
        if user and user.is_anonymous and app_id is None:
            return self.none()

        queryset: OrgUnitQuerySet = self.defer("geom", "simplified_geom")

        if user and user.is_authenticated:
            account = user.iaso_profile.account

            # Filter on version ids (linked to the account)
            version_ids = (
                SourceVersion.objects.filter(data_source__projects__account=account)
                .values_list("id", flat=True)
                .distinct()
            )
            queryset = queryset.filter(version_id__in=version_ids)

            # If applicable, filter on the org units associated to the user but only when the user is not a super user
            if user.iaso_profile.org_units.exists() and not user.is_superuser:
                queryset = queryset.hierarchy(user.iaso_profile.org_units.all())

        if app_id is not None:
            try:
                project = Project.objects.get_for_user_and_app_id(user, app_id)

                if project.account is None:
                    # cannot filter on default version if no project or project has no account
                    return self.none()

                queryset = queryset.filter(
                    org_unit_type__projects__in=[project], version=project.account.default_version
                )
            except Project.DoesNotExist:
                return self.none()

        return queryset


class OrgUnitManager(models.Manager):
    def parents_q(self, org_units) -> Q:
        """Create Q query object for all the parents for all the org units present

        This fix the problem in django query that it would otherwise only give the intersection
        """
        if not org_units:
            return Q(pk=None)
        queries = [Q(path__ancestors=org_unit.path) for org_unit in org_units]
        q = reduce(operator.or_, queries)
        return q


class OrgUnit(TreeModel):
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
    version = models.ForeignKey("SourceVersion", null=True, blank=True, on_delete=models.CASCADE)
    parent = models.ForeignKey("OrgUnit", on_delete=models.CASCADE, null=True, blank=True)
    path = PathField(null=True, blank=True, unique=True)
    aliases = ArrayField(
        models.CharField(max_length=255, blank=True, db_collation="case_insensitive"), size=100, null=True, blank=True
    )

    org_unit_type = models.ForeignKey(OrgUnitType, on_delete=models.CASCADE, null=True, blank=True)

    sub_source = models.TextField(null=True, blank=True)  # sometimes, in a given source, there are sub sources
    source_ref = models.TextField(null=True, blank=True, db_index=True)
    geom = MultiPolygonField(null=True, blank=True, srid=4326, geography=True)
    simplified_geom = MultiPolygonField(null=True, blank=True, srid=4326, geography=True)
    catchment = MultiPolygonField(null=True, blank=True, srid=4326, geography=True)
    geom_ref = models.IntegerField(null=True, blank=True)
    reference_instances = models.ManyToManyField("Instance", through="OrgUnitReferenceInstance", blank=True)

    gps_source = models.TextField(null=True, blank=True)
    location = PointField(null=True, blank=True, geography=True, dim=3, srid=4326)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    extra_fields = models.JSONField(default=dict)

    opening_date = models.DateField(blank=True, null=True)  # Start date of activities of the organisation unit
    closed_date = models.DateField(blank=True, null=True)  # End date of activities of the organisation unit
    objects = OrgUnitManager.from_queryset(OrgUnitQuerySet)()  # type: ignore

    class Meta:
        indexes = [
            GistIndex(fields=["path"], buffering=True),
            GinIndex(fields=["extra_fields"]),
        ]

    def root(self):
        if self.path is not None and len(self.path) > 1:
            return self.ancestors().exclude(id=self.id).first()

    def country_ancestors(self):
        if self.path is not None:
            return self.ancestors().filter(org_unit_type__category="COUNTRY")

    def save(self, *args, skip_calculate_path: bool = False, force_recalculate: bool = False, **kwargs):
        """Override default save() to make sure that the path property is calculated and saved,
        for this org unit and its children.

        :param skip_calculate_path: use with caution - can be useful in scripts where the extra transactions
                                    would be a burden, but the path needs to be set afterwards
        :param force_recalculate: use with caution - used to force recalculation of paths
        """
        # work around https://code.djangoproject.com/ticket/33787
        # where we had empty Z point in the database but couldn't save the OrgUnit back.
        # because it was missing a dimension
        if self.location is not None and self.location.empty:
            self.location = None

        if skip_calculate_path:
            super().save(*args, **kwargs)
        else:
            with transaction.atomic():
                super().save(*args, **kwargs)
                OrgUnit.objects.bulk_update(self.calculate_paths(force_recalculate=force_recalculate), ["path"])

    def calculate_paths(self, force_recalculate: bool = False) -> typing.List["OrgUnit"]:
        """Calculate the path for this org unit and all its children.

        This method will check if this org unit path should change. If it is the case (or if force_recalculate is
        True), it will update the path property for the org unit and its children, and return all the modified
        records.

        Please note that this method does not save the modified records. Instead, they are updated in bulk in the
        save() method.

        :param force_recalculate: calculate path for all descendants, even if this org unit path does not change
        """

        # For now, we will skip org units that have a parent without a path.
        # The idea is that a management command (set_org_unit_path) will handle the initial seeding of the
        # path field, starting at the top of the pyramid. Once this script has been run and the field is filled for
        # all org units, this should not happen anymore.
        # TODO: remove condition below
        if self.parent is not None and self.parent.path is None:
            return []

        # keep track of updated records
        updated_records = []

        # noinspection PyUnresolvedReferences
        base_path = [] if self.parent is None else list(self.parent.path)
        new_path = [*base_path, str(self.pk)]
        path_has_changed = new_path != self.path

        if path_has_changed:
            self.path = new_path
            updated_records += [self]

        if path_has_changed or force_recalculate:
            for child in self.orgunit_set.all():
                updated_records += child.calculate_paths(force_recalculate)

        return updated_records

    def __str__(self):
        return "%s %s %d" % (self.org_unit_type, self.name, self.id if self.id else -1)

    def as_dict_for_mobile_lite(self):
        return {
            "n": self.name,
            "id": self.id,
            "p": self.parent_id,
            "out": self.org_unit_type_id,
            "c_a": self.created_at.timestamp() if self.created_at else None,
            "lat": self.location.y if self.location else None,
            "lon": self.location.x if self.location else None,
            "alt": self.location.z if self.location else None,
        }

    def as_dict_for_mobile(self):
        return {
            "name": self.name,
            "id": self.id,
            "parent_id": self.parent_id,
            "org_unit_type_id": self.org_unit_type_id,
            "org_unit_type_name": self.org_unit_type.name if self.org_unit_type else None,
            "validation_status": self.validation_status if self.org_unit_type else None,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "aliases": self.aliases,
        }

    def as_dict(self, with_groups=True):
        res = {
            "name": self.name,
            "short_name": self.name,
            "id": self.id,
            "source": self.version.data_source.name if self.version else None,
            "source_id": self.version.data_source.id if self.version else None,
            "source_ref": self.source_ref,
            "parent_id": self.parent_id,
            "org_unit_type_id": self.org_unit_type_id,
            "org_unit_type_name": self.org_unit_type.name if self.org_unit_type else None,
            "org_unit_type_depth": self.org_unit_type.depth if self.org_unit_type else None,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "aliases": self.aliases,
            "validation_status": self.validation_status,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "has_geo_json": True if self.simplified_geom else False,
            "version": self.version.number if self.version else None,
            "opening_date": self.opening_date.strftime("%d/%m/%Y") if self.opening_date else None,
            "closed_date": self.closed_date.strftime("%d/%m/%Y") if self.closed_date else None,
        }

        if hasattr(self, "search_index"):
            res["search_index"] = self.search_index
        return res

    def as_dict_with_parents(self, light=False, light_parents=True):
        res = {
            "name": self.name,
            "short_name": self.name,
            "id": self.id,
            "sub_source": self.sub_source,
            "sub_source_id": self.sub_source,
            "source_ref": self.source_ref,
            "source_url": (
                self.version.data_source.credentials.url
                if self.version and self.version.data_source and self.version.data_source.credentials
                else None
            ),
            "parent_id": self.parent_id,
            "validation_status": self.validation_status,
            "parent_name": self.parent.name if self.parent else None,
            "parent": (
                self.parent.as_dict_with_parents(light=light_parents, light_parents=light_parents)
                if self.parent
                else None
            ),
            "org_unit_type_id": self.org_unit_type_id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "aliases": self.aliases,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "has_geo_json": True if self.simplified_geom else False,
            "creator": get_creator_name(self.creator),
            "opening_date": self.opening_date.strftime("%d/%m/%Y") if self.opening_date else None,
            "closed_date": self.closed_date.strftime("%d/%m/%Y") if self.closed_date else None,
        }
        if not light:  # avoiding joins here
            res["groups"] = [group.as_dict(with_counts=False) for group in self.groups.all()]
            res["org_unit_type_name"] = self.org_unit_type.name if self.org_unit_type else None
            res["org_unit_type"] = self.org_unit_type.as_dict() if self.org_unit_type else None
            res["source"] = self.version.data_source.name if self.version else None
            res["source_id"] = self.version.data_source.id if self.version else None
            res["version"] = self.version.number if self.version else None
        if hasattr(self, "search_index"):
            res["search_index"] = self.search_index

        if hasattr(self, "instances_count"):
            res["instances_count"] = self.instances_count

        return res

    def as_small_dict(self):
        res = {
            "name": self.name,
            "id": self.id,
            "parent_id": self.parent_id,
            "validation_status": self.validation_status,
            "parent_name": self.parent.name if self.parent else None,
            "source": self.version.data_source.name if self.version else None,
            "source_ref": self.source_ref,
            "parent": self.parent.as_small_dict() if self.parent else None,
            "org_unit_type_name": self.org_unit_type.name if self.org_unit_type else None,
            "opening_date": self.opening_date.strftime("%d/%m/%Y") if self.opening_date else None,
            "closed_date": self.closed_date.strftime("%d/%m/%Y") if self.closed_date else None,
        }
        if hasattr(self, "search_index"):
            res["search_index"] = self.search_index
        return res

    def as_dict_for_csv(self):
        return {
            "name": self.name,
            "id": self.id,
            "source_ref": self.source_ref,
            "parent_id": self.parent_id,
            "org_unit_type": self.org_unit_type.name,
        }

    def as_minimal_dict_with_parent(self):
        return {
            "name": self.name,
            "id": self.id,
            "parent": self.parent.as_minimal_dict() if self.parent else None,
        }

    def as_minimal_dict(self):
        return {
            "name": self.name,
            "id": self.id,
        }

    def as_location(self, with_parents):
        res = {
            "id": self.id,
            "name": self.name,
            "short_name": self.name,
            "parent_id": self.parent_id,
            "parent_name": self.parent.name if self.parent else None,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "has_geo_json": True if self.simplified_geom else False,
            "org_unit_type": self.org_unit_type.name if self.org_unit_type else None,
            "org_unit_type_id": self.org_unit_type.id if self.org_unit_type else None,
            "org_unit_type_depth": self.org_unit_type.depth if self.org_unit_type else None,
            "source_id": self.version.data_source.id if self.version else None,
            "source_name": self.version.data_source.name if self.version else None,
        }
        if hasattr(self, "search_index"):
            res["search_index"] = self.search_index
        if with_parents:
            res["parent"] = self.parent.as_dict_with_parents(light=True, light_parents=True) if self.parent else None
        return res

    def source_path(self):
        """DHIS2-friendly path built using source refs"""

        path_components = []
        cur = self
        while cur:
            if cur.source_ref:
                path_components.insert(0, cur.source_ref)
            cur = cur.parent
        if len(path_components) > 0:
            return "/" + ("/".join(path_components))
        return None

    def get_reference_instances_details_for_api(self) -> list:
        return [instance.as_full_model() for instance in self.reference_instances.all()]

    def set_extra_fields(self, fields):
        self.extra_fields = self.extra_fields | fields
        self.save()


class OrgUnitReferenceInstance(models.Model):
    """
    Intermediary model between `OrgUnit` and `Instance`.
    Used to flag a form's Instance` as "reference instance".

    The "reference" mechanism works like this:

    - a `Form` can be flagged as "reference form" for a `OrgUnitType`
    - a form's `Instance` can be flagged as "reference instance" for a
        OrgUnit` if it's an instance of a "reference form"

    The logic to flag a "reference instance" is implemented
    in the `Instance` class.

    Note: if a "reference form" is removed from a `OrgUnitType`,
    we do nothing with the related "reference instances".
    """

    org_unit = models.ForeignKey("OrgUnit", on_delete=models.CASCADE)
    form = models.ForeignKey("Form", on_delete=models.CASCADE)
    instance = models.ForeignKey("Instance", on_delete=models.CASCADE)

    class Meta:
        # Only one `instance` by pair of org_unit/form.
        unique_together = ("org_unit", "form")


class OrgUnitChangeRequest(models.Model):
    """
    A request to change an OrgUnit.

    It can also be a request to create an OrgUnit. In this case the OrgUnit
    already exists in DB with `OrgUnit.validation_status == VALIDATION_NEW`.
    The change request will change `validation_status` to either
    `VALIDATION_REJECTED` or `VALIDATION_VALID`.
    """

    class Statuses(models.TextChoices):
        NEW = "new", _("New")
        REJECTED = "rejected", _("Rejected")
        APPROVED = "approved", _("Approved")

    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    org_unit = models.ForeignKey("OrgUnit", on_delete=models.CASCADE)
    status = models.CharField(choices=Statuses.choices, default=Statuses.NEW, max_length=40)

    # Metadata.

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="org_unit_change_created_set"
    )
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        User, null=True, blank=True, on_delete=models.SET_NULL, related_name="org_unit_change_updated_set"
    )
    rejection_comment = models.TextField(blank=True)

    # Fields for which a change can be requested.

    new_parent = models.ForeignKey(
        "OrgUnit", null=True, blank=True, on_delete=models.CASCADE, related_name="org_unit_change_parents_set"
    )
    new_name = models.CharField(max_length=255, blank=True)
    new_org_unit_type = models.ForeignKey(OrgUnitType, on_delete=models.CASCADE, null=True, blank=True)
    new_groups = models.ManyToManyField("Group", blank=True)
    new_location = PointField(null=True, blank=True, geography=True, dim=3, srid=4326)
    # `new_location_accuracy` is only used to help decision-making during validation: is the accuracy
    # good enough to change the location? The field doesn't exist on `OrgUnit`.
    new_location_accuracy = models.DecimalField(decimal_places=2, max_digits=7, blank=True, null=True)
    new_opening_date = models.DateField(blank=True, null=True)
    new_closed_date = models.DateField(blank=True, null=True)
    new_reference_instances = models.ManyToManyField("Instance", blank=True)

    requested_fields = ArrayField(
        models.CharField(max_length=30, blank=True),
        default=list,
        blank=True,
        help_text="List of fields names for which a change is requested.",
    )
    approved_fields = ArrayField(
        models.CharField(max_length=30, blank=True),
        default=list,
        blank=True,
        help_text="List of approved fields names (only a subset can be approved).",
    )

    # Old values are populated after a change has been approved.

    old_parent = models.ForeignKey("OrgUnit", null=True, blank=True, on_delete=models.CASCADE, related_name="+")
    old_name = models.CharField(max_length=255, blank=True)
    old_org_unit_type = models.ForeignKey(
        OrgUnitType, on_delete=models.CASCADE, null=True, blank=True, related_name="+"
    )
    old_groups = models.ManyToManyField("Group", blank=True, related_name="+")
    old_location = PointField(null=True, blank=True, geography=True, dim=3, srid=4326)
    old_opening_date = models.DateField(blank=True, null=True)
    old_closed_date = models.DateField(blank=True, null=True)
    old_reference_instances = models.ManyToManyField("Instance", blank=True, related_name="+")

    payment = models.ForeignKey(
        "Payment", on_delete=models.SET_NULL, null=True, blank=True, related_name="change_requests"
    )
    potential_payment = models.ForeignKey(
        "PotentialPayment", on_delete=models.SET_NULL, null=True, blank=True, related_name="change_requests"
    )

    class Meta:
        verbose_name = _("Org unit change request")
        indexes = [
            models.Index(fields=["created_at"]),
            models.Index(fields=["updated_at"]),
        ]

    def __str__(self) -> str:
        return f"ID #{self.id} - Org unit #{self.org_unit_id} - {self.get_status_display()}"

    def save(self, *args, **kwargs):
        self.clean()
        is_new = self.pk is None
        if is_new:
            # Save old values.
            self.old_parent = self.org_unit.parent
            self.old_name = self.org_unit.name
            self.old_org_unit_type = self.org_unit.org_unit_type
            self.old_location = self.org_unit.location
            self.old_opening_date = self.org_unit.opening_date
            self.old_closed_date = self.org_unit.closed_date
        super().save(*args, **kwargs)
        if is_new:
            # Wait for the instance to have an ID to save old m2m relations
            self.old_groups.set(self.org_unit.groups.all())
            self.old_reference_instances.set(self.org_unit.reference_instances.all())

    def clean(self, *args, **kwargs):
        super().clean()
        self.approved_fields = list(set(self.approved_fields))
        self.clean_approved_fields()
        self.clean_new_dates()

    def clean_approved_fields(self) -> None:
        for name in self.approved_fields:
            if name not in self.get_new_fields():
                raise ValidationError({"approved_fields": f"Value {name} is not a valid choice."})

    def clean_new_dates(self) -> None:
        if (self.new_opening_date and self.new_closed_date) and (self.new_closed_date <= self.new_opening_date):
            raise ValidationError("Closing date must be later than opening date.")

    def reject(self, user: User, rejection_comment: str) -> None:
        self.updated_by = user
        self.status = self.Statuses.REJECTED
        self.rejection_comment = rejection_comment
        self.save()

    def approve(self, user: User, approved_fields: typing.List[str], rejection_comment: str = "") -> None:
        self.__apply_changes(user, approved_fields)
        self.updated_by = user
        self.status = self.Statuses.APPROVED
        self.rejection_comment = rejection_comment
        self.approved_fields = approved_fields
        self.save()

    def __apply_changes(self, user: User, approved_fields: typing.List[str]) -> None:
        initial_org_unit = deepcopy(self.org_unit)

        for field_name in approved_fields:
            if field_name == "new_location_accuracy":
                continue
            elif field_name == "new_groups":
                self.org_unit.groups.set(self.new_groups.all())
            elif field_name == "new_reference_instances":
                # Delete old ones.
                self.org_unit.reference_instances.clear()
                for instance in self.new_reference_instances.all():
                    OrgUnitReferenceInstance.objects.create(
                        org_unit=self.org_unit,
                        form=instance.form,
                        instance=instance,
                    )
            # Handle non m2m fields.
            else:
                new_value = getattr(self, field_name)
                org_unit_field_name = field_name.replace("new_", "")
                setattr(self.org_unit, org_unit_field_name, new_value)

        if self.org_unit.validation_status == self.org_unit.VALIDATION_NEW:
            self.org_unit.validation_status = self.org_unit.VALIDATION_VALID

        self.org_unit.save()

        log_modification(initial_org_unit, self.org_unit, source=ORG_UNIT_CHANGE_REQUEST, user=user)

    @classmethod
    def get_new_fields(cls) -> typing.List[str]:
        """
        Returns the list of fields names which can store a change request.
        """
        return [field.name for field in cls._meta.get_fields() if field.name.startswith("new_")]
