from django.db.models.query import prefetch_related_objects
from iaso.models import OrgUnit, GroupSet
from .comparisons import as_field_types, Diff, Comparison
import json


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
        field_names = ["name", "geometry", "parent"]
        for group_set in GroupSet.objects.filter(source_version=version):
            field_names.append(
                "groupset:" + group_set.source_ref + ":" + group_set.name
            )

        field_types = as_field_types(field_names)

        orgunits_dhis2 = load_pyramid(version)
        orgunit_refs = load_pyramid(version_ref)
        self.iaso_logger.info(
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
                self.iaso_logger.info(
                    index, "will compare ", orgunit_ref, " vs ", orgunit_dhis2
                )

            comparisons = self.compare_fields(orgunit_dhis2, orgunit_ref, field_types)
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

        return (diffs, field_names)

    def compare_fields(self, orgunit_dhis2, orgunit_ref, field_types):
        comparisons = []

        for field in field_types:
            dhis2_value = field.access(orgunit_dhis2)
            ref_value = field.access(orgunit_ref)

            status = None
            same = field.is_same(dhis2_value, ref_value)
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
                    field=field.field_name,
                    status=status,
                    distance=0 if same else field.distance(dhis2_value, ref_value),
                )
            )

        return comparisons
