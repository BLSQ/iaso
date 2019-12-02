from django.contrib.gis.geos import Point
from django.db.models.query import prefetch_related_objects
from iaso.models import OrgUnit, GroupSet
import json


class Dictable:
    def as_dict(self):
        return self.__dict__

    def __str__(self):
        return "%s %s" % (self.__class__.__name__, self.as_dict())


class Diff(Dictable):
    def __init__(self, org_unit, status, comparisons):
        self.org_unit = org_unit
        self.status = status
        self.comparisons = comparisons

    def comparison(self, field):
        return next(x for x in self.comparisons if x.field == field)

    def are_fields_modified(self, fields):
        return (
            len(
                list(
                    x
                    for x in self.comparisons
                    if x.field in fields and x.status != "same"
                )
            )
            > 0
        )


class Comparison(Dictable):
    def __init__(self, field, status, before, after, distance):
        self.field = field
        self.before = before
        self.after = after
        self.status = status
        self.distance = distance


def load_pyramid(version):
    return (
        OrgUnit.objects.prefetch_related("group_set")
        .prefetch_related("group_set__groupset_set")
        .select_related("org_unit_type")
        .select_related("parent")
        .select_related("parent")
        .select_related("parent__parent")
        .filter(version=version)
        .all()
    )


def index_pyramid(orgunits):
    orgunits_by_source_ref = {}
    for orgunit in orgunits:
        orgunits_by_source_ref[orgunit.source_ref] = [orgunit]
    return orgunits_by_source_ref


class Differ:
    def __init__(self, logger):
        self.iaso_logger = logger

    def diff(self, version_ref, version, options):
        fields = ["name", "geometry", "parent"]
        for group_set in GroupSet.objects.filter(source_version=version):
            fields.append("groupset:" + group_set.source_ref + ":" + group_set.name)

        orgunits_dhis2 = load_pyramid(version)
        orgunit_refs = load_pyramid(version_ref)
        print(
            "comparing ",
            version_ref,
            "(",
            len(orgunits_dhis2),
            ")",
            " and ",
            version,
            "(",
            len(orgunit_refs),
            ")",
        )
        # speed how to index_by(&:source_ref)
        diffs = []
        index = 0
        orgunits_dhis2_by_ref = index_pyramid(orgunits_dhis2)
        for orgunit_ref in orgunit_refs:
            index = index + 1
            orgunit_dhis2_with_ref = orgunits_dhis2_by_ref.get(
                orgunit_ref.source_ref, []
            )
            status = "same"
            orgunit_dhis2 = None

            if len(orgunit_dhis2_with_ref) > 0:
                orgunit_dhis2 = orgunit_dhis2_with_ref[0]
            else:
                status = "new"

            if index % 100 == 0:
                print(index, "will compare ", orgunit_ref, " vs ", orgunit_dhis2)

            comparisons = self.compare_fields(orgunit_dhis2, orgunit_ref, fields)
            all_same = all(map(lambda comp: comp.status == "same", comparisons))
            if status != "new" and not all_same:
                status = "modified"
            elif status != "new" and all_same:
                status = "same"

            diff = Diff(
                org_unit=orgunit_dhis2 if orgunit_dhis2 else orgunit_ref,
                status=status,
                comparisons=comparisons,
            )
            diffs.append(diff)

        return (diffs, fields)

    def compare_fields(self, orgunit_dhis2, orgunit_ref, fields):
        comparisons = []

        for field in fields:
            dhis2_value = self.access_field(orgunit_dhis2, field)
            ref_value = self.access_field(orgunit_ref, field)

            status = None
            same = self.is_same(field, dhis2_value, ref_value)
            if same:
                status = "same"
            else:
                status = "modified"

            if dhis2_value is None and ref_value is not None:
                status = "new"

            comparisons.append(
                Comparison(
                    before=dhis2_value,
                    after=ref_value,
                    field=field,
                    status=status,
                    distance=0
                    if same
                    else self.distance_field(dhis2_value, ref_value, field, same),
                )
            )

        return comparisons

    def distance_field(self, dhis2_value, ref_value, field, same):
        if isinstance(dhis2_value, Point) and isinstance(ref_value, Point):
            # TODO  is this the good way to calculate the distances ?
            # https://docs.djangoproject.com/en/2.2/ref/contrib/gis/geos/#django.contrib.gis.geos.GEOSGeometry.distance
            return dhis2_value.distance(ref_value) * 100  # approx km ?
        return None

    def is_same(self, field, value, other_value):
        if field.startswith("groupset:"):
            val = sorted(map(lambda g: g["id"], value or []))
            other_val = sorted(map(lambda g: g["id"], other_value or []))
            return val == other_val

        return value == other_value

    def access_field(self, org_unit, field):
        if org_unit is None:
            return None

        if field == "name":
            return org_unit.name

        if field == "geometry":
            if org_unit.location:
                return org_unit.location
            if org_unit.geom:
                return org_unit.geom
            if org_unit.simplified_geom:
                return org_unit.simplified_geom
            return None

        if field == "parent":
            if org_unit.parent:
                return org_unit.parent.source_ref
            return None

        if field.startswith("groupset:"):
            groupset_ref = field.split(":")[1]
            groups = []
            for group in org_unit.group_set.all():
                for groupset in group.groupset_set.all():
                    if groupset.source_ref == groupset_ref:
                        groups.append({"id": group.source_ref, "name": group.name})

            return groups

        raise Exception("Unsupported field : '" + field + "'")
