"""
Field definitions for `OrgUnitChangeRequestViewSet.export_to_csv`.

Mirrors the declarative style of `iaso.diffing.comparisons`: each CSV column triplet
(before, after, conclusion) is described once as a `ChangeField` — its own "before"/
"after" accessors, plus the `requested_fields` entry that decides whether a difference
is reported as "updated" instead of "same" — rather than being hand-written inline,
once per field, in the export loop.
"""


def get_location_str(location):
    if not location:
        return None
    return f"{location.y}, {location.x}"


def get_reference_instance_ids(instances):
    if not instances.exists():
        return ""
    return ",".join(str(instance.id) for instance in instances.all().order_by("id"))


def get_parent_ref_ext(parent, level):
    if not parent or not hasattr(parent, "cached_ancestors"):
        return None
    if level <= len(parent.cached_ancestors):
        return parent.cached_ancestors[level - 1].source_ref
    return None


def _fmt_date(d):
    return d.strftime("%Y-%m-%d") if d else ""


def _join_group_names(groups):
    return ",".join(group.name for group in groups.all())


class ChangeField:
    """One before/after column pair of the CSV export, with an optional conclusion column.

    `requested_field` is the `OrgUnitChangeRequest.requested_fields` entry (e.g.
    "new_name") that must be present for a difference to be reported as "updated"
    instead of "same". Some columns (e.g. "Parent", "Reference submission") have no
    conclusion in `CSV_HEADER_COLUMNS` at all — pass `include_conclusion=False` for those.
    """

    def __init__(self, requested_field, before, after, max_len=None, include_conclusion=True):
        self.requested_field = requested_field
        self.before = before
        self.after = after
        self.max_len = max_len
        self.include_conclusion = include_conclusion

    def append_to(self, row, change_request):
        before = self.before(change_request)
        after = self.after(change_request)
        conclusion = None
        if self.include_conclusion:
            conclusion = "same"
            if self.requested_field in change_request.requested_fields and before != after:
                conclusion = "updated"
        if self.max_len is not None:
            before, after = before[: self.max_len], after[: self.max_len]
        row.extend([before, after])
        if conclusion is not None:
            row.append(conclusion)


NAME_FIELD = ChangeField(
    "new_name",
    before=lambda cr: cr.old_name if cr.kind == cr.Kind.ORG_UNIT_CHANGE else "",
    after=lambda cr: cr.new_name if cr.new_name else cr.org_unit.name,
)

PARENT_FIELD = ChangeField(
    "new_parent",
    before=lambda cr: cr.old_parent.name if cr.old_parent else "",
    after=lambda cr: (
        cr.new_parent.name if cr.new_parent else (cr.org_unit.parent.name if cr.org_unit.parent else None)
    ),
    include_conclusion=False,
)

OPENING_DATE_FIELD = ChangeField(
    "new_opening_date",
    before=lambda cr: _fmt_date(cr.old_opening_date),
    after=lambda cr: _fmt_date(cr.new_opening_date) if cr.new_opening_date else _fmt_date(cr.org_unit.opening_date),
)

CLOSING_DATE_FIELD = ChangeField(
    "new_closed_date",
    before=lambda cr: _fmt_date(cr.old_closed_date),
    after=lambda cr: _fmt_date(cr.new_closed_date) if cr.new_closed_date else _fmt_date(cr.org_unit.closed_date),
)

GROUPS_FIELD = ChangeField(
    "new_groups",
    before=lambda cr: _join_group_names(cr.old_groups),
    after=lambda cr: (
        _join_group_names(cr.new_groups) if cr.new_groups.exists() else _join_group_names(cr.org_unit.groups)
    ),
)

LOCATION_FIELD = ChangeField(
    "new_location",
    before=lambda cr: get_location_str(cr.old_location),
    after=lambda cr: (
        get_location_str(cr.new_location)
        if "new_location" in cr.requested_fields
        else get_location_str(cr.org_unit.location)
    ),
)

GEOM_FIELD = ChangeField(
    "new_geom",
    before=lambda cr: cr.old_geom.wkt if cr.old_geom else "",
    after=lambda cr: (
        (cr.new_geom.wkt if cr.new_geom else "")
        if "new_geom" in cr.requested_fields
        else (cr.org_unit.geom.wkt if cr.org_unit.geom else "")
    ),
    max_len=80,
)

CODE_FIELD = ChangeField(
    "new_code",
    before=lambda cr: cr.old_code,
    after=lambda cr: cr.new_code if "new_code" in cr.requested_fields else (cr.org_unit.code or ""),
)

REFERENCE_INSTANCES_FIELD = ChangeField(
    "new_reference_instances",
    before=lambda cr: get_reference_instance_ids(cr.old_reference_instances),
    after=lambda cr: (
        get_reference_instance_ids(cr.new_reference_instances)
        if cr.new_reference_instances.exists()
        else get_reference_instance_ids(cr.org_unit.reference_instances)
    ),
    include_conclusion=False,
)


def _ref_ext_parent_before(cr):
    return cr.old_parent


def _ref_ext_parent_after(cr):
    return cr.new_parent if cr.new_parent else cr.org_unit.parent


# "Ref Ext parent 1/2/3" columns: how many levels up the tree to report, from the
# change request's before/after parent. All three share the same `requested_field`
# because they're all derived from the parent change, not a field of their own.
REF_EXT_PARENT_FIELDS = [
    ChangeField(
        "new_parent",
        before=lambda cr, level=level: get_parent_ref_ext(_ref_ext_parent_before(cr), level),
        after=lambda cr, level=level: get_parent_ref_ext(_ref_ext_parent_after(cr), level),
    )
    for level in range(1, 4)
]

# Order matches `OrgUnitChangeRequestViewSet.CSV_HEADER_COLUMNS`, right after the
# basic (non-diffed) columns: id, org unit id, source ref, name, parent, type, groups,
# created/updated (by/at).
CHANGE_FIELDS = [
    NAME_FIELD,
    PARENT_FIELD,
    *REF_EXT_PARENT_FIELDS,
    OPENING_DATE_FIELD,
    CLOSING_DATE_FIELD,
    GROUPS_FIELD,
    LOCATION_FIELD,
    GEOM_FIELD,
    CODE_FIELD,
    REFERENCE_INSTANCES_FIELD,
]
