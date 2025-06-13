from django.db.models import Q

from iaso.models import Group, OrgUnit

from .comparisons import Comparison, Diff, as_field_types


def index_pyramid(orgunits):
    orgunits_by_source_ref = {}
    for orgunit in orgunits:
        if orgunits_by_source_ref.get(orgunit.source_ref, None) is None:
            orgunits_by_source_ref[orgunit.source_ref] = [orgunit]
        else:
            print("TWO ORG UNITS WITH THE SAME source_ref: %s (THIS SHOULD NOT HAPPEN!)" % orgunit.source_ref)

            orgunits_by_source_ref[orgunit.source_ref].append(orgunit)
    return orgunits_by_source_ref


class Differ:
    STATUS_NEW = "new"
    STATUS_MODIFIED = "modified"
    STATUS_SAME = "same"
    STATUS_NOT_IN_ORIGIN = "not in origin - ignored"
    STATUS_NEVER_SEEN = "never_seen"

    def __init__(self, logger):
        self.iaso_logger = logger

    def load_pyramid(
        self, version, validation_status=None, top_org_unit=None, org_unit_types=None, org_unit_group=None
    ):
        self.iaso_logger.info(f"loading pyramid {version.data_source} {version} {top_org_unit} {org_unit_types}")
        queryset = (
            OrgUnit.objects.prefetch_related("groups")
            .prefetch_related("groups__group_sets")
            .prefetch_related("parent")
            .prefetch_related("parent__parent")
            .prefetch_related("parent__parent__parent")
            .prefetch_related("parent__parent__parent__parent")
            .select_related("org_unit_type")
            .filter(version=version)
        )
        if validation_status:
            queryset = queryset.filter(validation_status=validation_status)
        if top_org_unit:
            parent = OrgUnit.objects.get(id=top_org_unit) if isinstance(top_org_unit, int) else top_org_unit
            queryset = queryset.hierarchy(parent)
        if org_unit_types:
            queryset = queryset.filter(org_unit_type__in=org_unit_types)
        if org_unit_group:
            queryset = queryset.filter(groups=org_unit_group).distinct()  # distinct because groups is m2m
        return queryset

    def diff(
        self,
        version_ref,
        version,
        ignore_groups=False,
        show_deleted_org_units=False,
        validation_status=None,
        validation_status_ref=None,
        top_org_unit=None,
        top_org_unit_ref=None,
        org_unit_types=None,
        org_unit_types_ref=None,
        org_unit_group=None,
        org_unit_group_ref=None,
        field_names=None,
    ):
        if field_names is None:
            field_names = ["name", "geometry", "parent", "opening_date", "closed_date"]
        elif not isinstance(field_names, list):
            field_names = list(field_names)

        orgunits_dhis2 = self.load_pyramid(
            version,
            validation_status=validation_status,
            top_org_unit=top_org_unit,
            org_unit_types=org_unit_types,
            org_unit_group=org_unit_group,
        )
        orgunit_refs = self.load_pyramid(
            version_ref,
            validation_status=validation_status_ref,
            top_org_unit=top_org_unit_ref,
            org_unit_types=org_unit_types_ref,
            org_unit_group=org_unit_group_ref,
        )

        # Fetching IDs to restrict groups to the ones that are in the pyramid
        orgunit_ids_in_ref_pyramid = set(orgunit_refs.values_list("id", flat=True))
        orgunit_ids_in_dhis2_pyramid = set(orgunits_dhis2.values_list("id", flat=True))
        org_unit_ids = orgunit_ids_in_dhis2_pyramid | orgunit_ids_in_ref_pyramid

        if not ignore_groups:
            groups = Group.objects.filter(
                Q(Q(source_version=version) | Q(source_version=version_ref)),
                source_ref__isnull=False,
                org_units__in=org_unit_ids,
            ).distinct("source_ref")
            for group in groups:
                field_names.append("group:" + group.source_ref + ":" + group.name)

        self.iaso_logger.info(f"will compare the following fields {field_names}")
        field_types = as_field_types(field_names)

        self.iaso_logger.info(f"comparing {version_ref} ({len(orgunits_dhis2)}) and {version} ({len(orgunit_refs)})")
        # speed how to index_by(&:source_ref)
        diffs = []
        index = 0
        orgunits_dhis2_by_ref = index_pyramid(orgunits_dhis2)

        for orgunit_ref in orgunit_refs:
            index = index + 1
            orgunit_dhis2_with_ref = orgunits_dhis2_by_ref.get(orgunit_ref.source_ref, [])
            status = "same"
            orgunit_dhis2 = None

            if len(orgunit_dhis2_with_ref) > 0:
                orgunit_dhis2 = orgunit_dhis2_with_ref[0]
            else:
                status = "new"

            if index % 100 == 0:
                self.iaso_logger.info(index, "will compare ", orgunit_ref, " vs ", orgunit_dhis2)

            comparisons = self.compare_fields(orgunit_dhis2, orgunit_ref, field_types)
            all_same = all(map(lambda comp: comp.status == self.STATUS_SAME, comparisons))
            if status != self.STATUS_NEW and not all_same:
                status = self.STATUS_MODIFIED
            elif status != self.STATUS_NEW and all_same:
                status = self.STATUS_SAME

            diff = Diff(orgunit_ref=orgunit_ref, orgunit_dhis2=orgunit_dhis2, status=status, comparisons=comparisons)
            diffs.append(diff)

        if show_deleted_org_units:
            target_set = set(orgunits_dhis2_by_ref.keys())
            source_set = set([org_unit.source_ref for org_unit in orgunit_refs])
            deleted_org_units_ids = target_set - source_set
            for deleted_id in deleted_org_units_ids:
                orgunit_dhis2 = orgunits_dhis2_by_ref.get(deleted_id)[0]
                comparisons = []
                for field in field_types:
                    comparison = Comparison(
                        before=field.access(orgunit_dhis2),
                        after=None,
                        field=field.field_name,
                        status=self.STATUS_NOT_IN_ORIGIN,
                        distance=100,
                    )
                    comparisons.append(comparison)
                used_to_exist = OrgUnit.objects.filter(source_ref=deleted_id, version=version).count() > 0
                status = self.STATUS_NOT_IN_ORIGIN if used_to_exist else self.STATUS_NEVER_SEEN
                diff = Diff(orgunit_ref=None, orgunit_dhis2=orgunit_dhis2, status=status, comparisons=comparisons)
                diffs.append(diff)

        return diffs, field_names

    def compare_fields(self, orgunit_dhis2, orgunit_ref, field_types):
        comparisons = []

        for field in field_types:
            dhis2_value = field.access(orgunit_dhis2)
            ref_value = field.access(orgunit_ref)

            same = field.is_same(dhis2_value, ref_value)
            if same:
                status = self.STATUS_SAME
            else:
                status = self.STATUS_MODIFIED

            if not dhis2_value and ref_value:
                status = self.STATUS_NEW
            if not same and dhis2_value is not None and (ref_value is None or ref_value == []):
                status = self.STATUS_NOT_IN_ORIGIN

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
