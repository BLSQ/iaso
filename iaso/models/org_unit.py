import operator
import typing
from copy import deepcopy
from functools import reduce
from django.db import models, transaction
from django.contrib.postgres.indexes import GistIndex
from django.contrib.gis.db.models.fields import PointField, MultiPolygonField
from django.contrib.postgres.fields import ArrayField, CITextField
from django.contrib.auth.models import User, AnonymousUser
from django_ltree.fields import PathField
from django.utils.translation import ugettext_lazy as _

from hat.audit import models as audit_models
from .base import Group, SourceVersion
from .project import Project


class OrgUnitTypeQuerySet(models.QuerySet):
    def filter_for_user_and_app_id(self, user: typing.Union[User, AnonymousUser, None], app_id: str):
        if user and user.is_anonymous and app_id is None:
            return self.none()

        queryset = self.all()

        if user and user.is_authenticated:
            queryset = queryset.filter(projects__account=user.iaso_profile.account)

        if app_id is not None:
            try:
                project = Project.objects.get_for_user_and_app_id(user, app_id)
                queryset = queryset.filter(projects__in=[project])
            except Project.DoesNotExist:
                return self.none()

        return queryset


class OrgUnitType(models.Model):
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sub_unit_types = models.ManyToManyField("OrgUnitType", related_name="super_types", blank=True)

    projects = models.ManyToManyField("Project", related_name="unit_types", blank=False)
    depth = models.PositiveSmallIntegerField(null=True, blank=True)

    objects = OrgUnitTypeQuerySet.as_manager()

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


class OrgUnitQuerySet(models.QuerySet):
    def children(self, org_unit):
        # We need to cast PathValue instances to strings - this could be fixed upstream
        # (https://github.com/mariocesar/django-ltree/issues/8)
        return self.filter(path__descendants=str(org_unit.path), path__depth=len(org_unit.path) + 1)

    def hierarchy(self, org_unit):
        # We need to cast PathValue instances to strings - this could be fixed upstream
        # (https://github.com/mariocesar/django-ltree/issues/8)
        if isinstance(org_unit, (list, models.QuerySet)):
            query = reduce(operator.or_, [models.Q(path__descendants=str(ou.path)) for ou in list(org_unit)])
        else:
            query = models.Q(path__descendants=str(org_unit.path))

        return self.filter(query)

    def descendants(self, org_unit):
        # We need to cast PathValue instances to strings - this could be fixed upstream
        # (https://github.com/mariocesar/django-ltree/issues/8)
        return self.filter(path__descendants=str(org_unit.path), path__depth__gt=len(org_unit.path))

    def filter_for_user_and_app_id(self, user: typing.Union[User, AnonymousUser, None], app_id: str):
        if user and user.is_anonymous and app_id is None:
            return self.none()

        queryset = self.all()

        if user and user.is_authenticated:
            account = user.iaso_profile.account

            # Filter on version ids (linked to the account)
            version_ids = (
                SourceVersion.objects.filter(data_source__projects__account=account)
                .values_list("id", flat=True)
                .distinct()
            )
            queryset = queryset.filter(version_id__in=version_ids)

            # If applicable, filter on the org units associated to the user
            if user.iaso_profile.org_units.count() > 0:
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
    def update_single_unit_from_bulk(
        self, user, org_unit, *, validation_status, org_unit_type_id, groups_ids_added, groups_ids_removed
    ):
        """Used within the context of a bulk operation"""

        original_copy = deepcopy(org_unit)
        if validation_status is not None:
            org_unit.validation_status = validation_status
        if org_unit_type_id is not None:
            org_unit_type = OrgUnitType.objects.get(pk=org_unit_type_id)
            org_unit.org_unit_type = org_unit_type
        if groups_ids_added is not None:
            for group_id in groups_ids_added:
                group = Group.objects.get(pk=group_id)
                group.org_units.add(org_unit)
        if groups_ids_removed is not None:
            for group_id in groups_ids_removed:
                group = Group.objects.get(pk=group_id)
                group.org_units.remove(org_unit)

        org_unit.save()

        audit_models.log_modification(original_copy, org_unit, source=audit_models.ORG_UNIT_API_BULK, user=user)


class OrgUnit(models.Model):
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
    aliases = ArrayField(CITextField(max_length=255, blank=True), size=100, null=True, blank=True)

    org_unit_type = models.ForeignKey(OrgUnitType, on_delete=models.CASCADE, null=True, blank=True)

    sub_source = models.TextField(null=True, blank=True)  # sometimes, in a given source, there are sub sources
    source_ref = models.TextField(null=True, blank=True, db_index=True)
    geom = MultiPolygonField(null=True, blank=True, srid=4326, geography=True)
    simplified_geom = MultiPolygonField(null=True, blank=True, srid=4326, geography=True)
    catchment = MultiPolygonField(null=True, blank=True, srid=4326, geography=True)
    geom_ref = models.IntegerField(null=True, blank=True)

    gps_source = models.TextField(null=True, blank=True)
    location = PointField(null=True, blank=True, geography=True, dim=3, srid=4326)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    objects = OrgUnitManager.from_queryset(OrgUnitQuerySet)()

    class Meta:
        indexes = [GistIndex(fields=["path"], buffering=True)]

    def save(self, *args, skip_calculate_path: bool = False, force_recalculate: bool = False, **kwargs):
        """Override default save() to make sure that the path property is calculated and saved,
        for this org unit and its children.

        :param skip_calculate_path: use with caution - can be useful in scripts where the extra transactions
                                    would be a burden, but the path needs to be set afterwards
        :param force_recalculate: use with caution - used to force recalculation of paths
        """

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
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "aliases": self.aliases,
            "validation_status": self.validation_status,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "has_geo_json": True if self.simplified_geom else False,
            "version": self.version.number if self.version else None,
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
            "source_url": self.version.data_source.credentials.url
            if self.version and self.version.data_source and self.version.data_source.credentials
            else None,
            "parent_id": self.parent_id,
            "validation_status": self.validation_status,
            "parent_name": self.parent.name if self.parent else None,
            "parent": self.parent.as_dict_with_parents(light=light_parents, light_parents=light_parents)
            if self.parent
            else None,
            "org_unit_type_id": self.org_unit_type_id,
            "created_at": self.created_at.timestamp() if self.created_at else None,
            "updated_at": self.updated_at.timestamp() if self.updated_at else None,
            "aliases": self.aliases,
            "latitude": self.location.y if self.location else None,
            "longitude": self.location.x if self.location else None,
            "altitude": self.location.z if self.location else None,
            "has_geo_json": True if self.simplified_geom else False,
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
            "org_unit_type_depth": self.org_unit_type.depth if self.org_unit_type else None,
            "source_id": self.version.data_source.id if self.version else None,
            "source_name": self.version.data_source.name if self.version else None,
        }
        if hasattr(self, "search_index"):
            res["search_index"] = self.search_index
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
