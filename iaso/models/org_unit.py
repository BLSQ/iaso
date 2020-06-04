from copy import deepcopy
from django.db import models
from django.contrib.postgres.indexes import GistIndex
from django.contrib.gis.db.models.fields import PointField, PolygonField
from django.contrib.postgres.fields import ArrayField, CITextField
from django.contrib.auth.models import User
from django_ltree.fields import PathField

from hat.audit import models as audit_models
from iaso.models import Group

GEO_SOURCE_CHOICES = (
    ("snis", "SNIS"),
    ("ucla", "UCLA"),
    ("pnltha", "PNL THA"),
    ("derivated", "Derivated from actual data"),
)


class OrgUnitType(models.Model):
    name = models.CharField(max_length=255)
    short_name = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sub_unit_types = models.ManyToManyField(
        "OrgUnitType", related_name="super_types", blank=True
    )

    projects = models.ManyToManyField("Project", related_name="unit_types", blank=True)
    depth = models.PositiveSmallIntegerField(null=True, blank=True)

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


class OrgUnitQuerySet(models.QuerySet):
    def children(self, org_unit):
        return self.filter(
            path__descendants=org_unit.path, path__depth=len(org_unit.path) + 1
        )

    def hierarchy(self, org_unit):
        return self.filter(path__descendants=org_unit.path)

    def descendants(self, org_unit):
        return self.filter(
            path__descendants=org_unit.path, path__depth__gt=len(org_unit.path)
        )


class OrgUnitManager(models.Manager):
    def update_single_unit_from_bulk(
        self,
        user,
        org_unit,
        *,
        validated,
        org_unit_type_id,
        groups_ids_added,
        groups_ids_removed
    ):
        """Used within the context of a bulk operation"""

        original_copy = deepcopy(org_unit)

        if validated is not None:
            org_unit.validated = validated
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

        audit_models.log_modification(
            original_copy, org_unit, source=audit_models.ORG_UNIT_API_BULK, user=user
        )


class OrgUnit(models.Model):
    name = models.CharField(max_length=255)
    uuid = models.TextField(null=True, blank=True, db_index=True)
    custom = models.BooleanField(default=False)
    validated = models.BooleanField(default=True, db_index=True)
    version = models.ForeignKey(
        "SourceVersion", null=True, blank=True, on_delete=models.CASCADE
    )
    parent = models.ForeignKey(
        "OrgUnit", on_delete=models.CASCADE, null=True, blank=True
    )
    path = PathField(null=True, blank=True, unique=True)
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
    )  # TODO: deprecated, remove me (location should be use instead)
    longitude = models.DecimalField(
        max_digits=11, decimal_places=8, null=True, blank=True
    )  # TODO: deprecated, remove me (location should be use instead)
    gps_source = models.TextField(
        null=True, blank=True
    )  # much more diverse than above GEO_SOURCE_CHOICES
    location = PointField(null=True, blank=True, dim=3, srid=4326)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    objects = OrgUnitManager.from_queryset(OrgUnitQuerySet)()

    class Meta:
        indexes = [GistIndex(fields=["path"], buffering=True)]

    def save(self, *args, force_calculate_path=False, **kwargs):
        super().save(*args, **kwargs)
        update_children_path = self._update_path(force_calculate_path)

        if update_children_path or force_calculate_path:
            for child in OrgUnit.objects.filter(parent=self):
                child.save(
                    force_calculate_path=force_calculate_path, update_fields=["path"]
                )

    def _update_path(self, force: bool) -> bool:
        # For now, we will skip org units that have a parent without a path.
        # The idea is that a management command (set_org_unit_path) will handle the initial seeding of the
        # path field, starting at the top of the pyramid. Once this script has been run and the field is filled for
        # all org units, this should not happen anymore.
        # TODO: remove force_calculate_path and condition below
        if self.parent is not None and self.parent.path is None:
            return False

        base_path = [] if self.parent is None else self.parent.path
        new_path = [*base_path, str(self.pk)]
        path_change = new_path != self.path

        if path_change:
            self.path = new_path
            super().save(update_fields=["path"])

        return path_change or force

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
            "altitude": self.location.z if self.location else None,
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
            "altitude": self.location.z if self.location else None,
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
            "altitude": self.location.z if self.location else None,
            "has_geo_json": True if self.simplified_geom else False,
            "version": self.version.number if self.version else None,
            "groups": [group.as_dict() for group in self.groups.all()],
        }

    def as_small_dict(self):
        return {
            "name": self.name,
            "id": self.id,
            "parent_id": self.parent_id,
            "parent_name": self.parent.name if self.parent else None,
            "source": self.version.data_source.name if self.version else None,
            "source_ref": self.source_ref,
            "parent": self.parent.as_small_dict() if self.parent else None,
            "org_unit_type_name": self.org_unit_type.name
            if self.org_unit_type
            else None,
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
            "org_unit_type_depth": self.org_unit_type.depth
            if self.org_unit_type
            else None,
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
