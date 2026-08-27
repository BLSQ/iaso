import re

from django.contrib.gis.geos import Point


_COORD_RE = re.compile(r"(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)")
# 6 decimal places ≈ 0.11 m — tight enough to catch real edits, loose enough to absorb:
#   - floating-point drift introduced by WKT serialization round-trips, and
#   - precision differences between source systems (DHIS2, EF, INS) that store the
#     same boundary with a different number of decimal places.
_COORD_DECIMALS = 6


def _round_coord(m):
    return f"{round(float(m.group(1)), _COORD_DECIMALS)} {round(float(m.group(2)), _COORD_DECIMALS)}"


class Dictable:
    def as_dict(self):
        return self.__dict__

    def __str__(self):
        return "%s %s" % (self.__class__.__name__, self.as_dict())


class FieldType(Dictable):
    def __init__(self, field_name):
        self.field_name = field_name

    def is_same(self, value, other_value):
        return value == other_value

    def distance(self, dhis2_value, ref_value):
        return None


class NameFieldType(FieldType):
    def access(self, org_unit):
        if org_unit is None:
            return None
        return org_unit.name

    def is_same(self, value, other_value):
        normalized_value = None if (value is None or value == "") else value
        normalized_other = None if (other_value is None or other_value == "") else other_value
        return normalized_value == normalized_other


class CodeFieldType(FieldType):
    def access(self, org_unit):
        if org_unit is None:
            return None  # code is not nullable, but we return None to differentiate a blank code from a missing orgunit
        return org_unit.code

    def is_same(self, value, other_value):
        normalized_value = None if (value is None or value == "") else value
        normalized_other = None if (other_value is None or other_value == "") else other_value
        return normalized_value == normalized_other


class GeometryFieldType(FieldType):
    def access(self, org_unit):
        if org_unit is None:
            return None
        if org_unit.location:
            return org_unit.location
        if org_unit.geom:
            return org_unit.geom
        if org_unit.simplified_geom:
            return org_unit.simplified_geom
        return None

    def is_same(self, value, other_value):
        if value is None and other_value is None:
            return True
        if value is None or other_value is None:
            return False
        if value.geom_type != other_value.geom_type:
            return False
        if isinstance(value, Point):
            return round(value.x, _COORD_DECIMALS) == round(other_value.x, _COORD_DECIMALS) and round(
                value.y, _COORD_DECIMALS
            ) == round(other_value.y, _COORD_DECIMALS)
        # Polygons: normalise ring orientation then round coordinates before comparing.
        # normalize() mutates in place and returns None in Django 3.x, so call it
        # on clones to avoid mutating the original geometry objects.
        v, ov = value.clone(), other_value.clone()
        v.normalize()
        ov.normalize()
        return _COORD_RE.sub(_round_coord, v.wkt) == _COORD_RE.sub(_round_coord, ov.wkt)

    def distance(self, dhis2_value, ref_value):
        if dhis2_value is None or ref_value is None:
            return None
        # Centroid distance: how far the geometric centres have moved.
        # Works for Point (centroid == self) and Polygon/MultiPolygon alike.
        # × 111 converts degrees → km (equatorial approximation, consistent with the point case).
        return dhis2_value.centroid.distance(ref_value.centroid) * 111


class ParentFieldType(FieldType):
    def access(self, org_unit):
        if org_unit is None:
            return None

        if org_unit.parent:
            return org_unit.parent.source_ref
        return None


class GroupSetFieldType(FieldType):
    def __init__(self, field_name):
        super().__init__(field_name)
        self.groupset_ref = field_name.split(":")[1]
        self.groupset_name = field_name.split(":")[2]

    def access(self, org_unit):
        if org_unit is None:
            return None
        groups = []
        for group in org_unit.groups.all():
            for groupset in group.group_sets.all():
                if groupset.source_ref == self.groupset_ref:
                    groups.append({"id": group.source_ref, "name": group.name})

        return groups

    def is_same(self, value, other_value):
        val = sorted(map(lambda g: g["id"], value or []))
        other_val = sorted(map(lambda g: g["id"], other_value or []))
        return val == other_val


class GroupFieldType(FieldType):
    def __init__(self, field_name):
        super().__init__(field_name)
        self.group_ref = field_name.split(":")[1]
        self.group_name = field_name.split(":")[2]

    def access(self, org_unit):
        if org_unit is None:
            return None
        groups = []
        for group in org_unit.groups.all():
            if group.source_ref == self.group_ref:
                groups.append({"id": group.source_ref, "name": group.name, "iaso_id": group.pk})

        return groups

    def is_same(self, value, other_value):
        val = sorted(map(lambda g: g["id"], value or []))
        other_val = sorted(map(lambda g: g["id"], other_value or []))
        return val == other_val


class OpeningDateFieldType(FieldType):
    def access(self, org_unit):
        if org_unit is None:
            return None
        return org_unit.opening_date


class ClosedDateFieldType(FieldType):
    def access(self, org_unit):
        if org_unit is None:
            return None
        return org_unit.closed_date


def as_field_types(field_names):
    field_types = []
    for field_name in field_names:
        if field_name == "name":
            field_types.append(NameFieldType(field_name))
        elif field_name == "code":
            field_types.append(CodeFieldType(field_name))
        elif field_name == "geometry":
            field_types.append(GeometryFieldType(field_name))
        elif field_name == "parent":
            field_types.append(ParentFieldType(field_name))
        elif field_name.startswith("groupset:"):
            field_types.append(GroupSetFieldType(field_name))
        elif field_name.startswith("group:"):
            field_types.append(GroupFieldType(field_name))
        elif field_name == "opening_date":
            field_types.append(OpeningDateFieldType(field_name))
        elif field_name == "closed_date":
            field_types.append(ClosedDateFieldType(field_name))
        else:
            raise Exception("Unsupported field : '" + field_name + "'")
    return field_types


class Diff(Dictable):
    def __init__(self, orgunit_ref, orgunit_dhis2, status, comparisons):
        self.org_unit = orgunit_ref if orgunit_ref else orgunit_dhis2
        self.orgunit_ref = orgunit_ref
        self.orgunit_dhis2 = orgunit_dhis2
        self.status = status
        self.comparisons = comparisons

    def comparison(self, field):
        try:
            return next(x for x in self.comparisons if x.field == field)
        except StopIteration:
            return None

    def are_fields_modified(self, fields):
        return len(list(x for x in self.comparisons if x.field in fields and x.status != "same")) > 0


class Comparison(Dictable):
    def __init__(self, field, status, before, after, distance):
        self.field = field
        self.before = before
        self.after = after
        self.status = status
        self.distance = distance
