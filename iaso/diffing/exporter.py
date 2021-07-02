import json

from django.contrib.gis.geos import GEOSGeometry

from iaso.models import generate_id_for_dhis_2
from .comparisons import as_field_types


def all_slices(iterables, size: int):
    batch = 0
    slices = []
    while batch * size < len(iterables):
        slices.append(iterables[batch * size : (batch + 1) * size])
        batch += 1

    return slices


def sort_by_path(diffs):
    return sorted(diffs, key=lambda d: str(d.org_unit.path))


def assign_dhis2_ids(to_create_diffs):
    # ideally should run on diff
    # assign source_ref for orgunits to avoid double creation
    for to_create in to_create_diffs:
        if to_create.org_unit.source_ref is None:
            to_create.org_unit.source_ref = generate_id_for_dhis_2()
            to_create.org_unit.save()

    for to_create in to_create_diffs:
        to_create.org_unit.refresh_from_db()


def to_dhis2_feature_type(type):
    # TODO better way : to snake case upper case ?
    if type == "Point":
        return "POINT"

    if type == "Polygon":
        return "POLYGON"

    if type == "MultiPolygon":
        return "MULTI_POLYGON"


def dhis2_group_contains(dhis2_group, org_unit):
    for ou in dhis2_group["organisationUnits"]:
        if ou["id"] == org_unit.source_ref:
            return True
    return False


class Exporter:
    def __init__(self, logger):
        self.iaso_logger = logger

    def export_to_dhis2(self, api, diffs, fields):
        self.iaso_logger.ok("   ------ New org units----")
        self.create_missings(api, diffs)
        self.iaso_logger.ok("   ------ Modified org units----")
        self.update_orgunits(api, diffs)
        self.iaso_logger.ok("   ------ Modified groups----")
        self.update_groups(api, diffs, fields)

    def create_missings(self, api, diffs):
        to_create_diffs = list(filter(lambda x: x.status == "new", diffs))
        self.iaso_logger.info("orgunits to create : ", len(to_create_diffs))

        assign_dhis2_ids(to_create_diffs)
        to_create_diffs = sort_by_path(to_create_diffs)

        # build the "minimal" payloads for creation, groups only done at later stage
        for to_create in to_create_diffs:
            name_comparison = to_create.comparison("name")
            self.iaso_logger.info("----", name_comparison.after, to_create.org_unit.path)

            payload = {
                "id": to_create.org_unit.source_ref,
                "name": name_comparison.after,
                "shortName": name_comparison.after[:50],
                "openingDate": "1960-08-03T00:00:00.000",
            }
            if to_create.org_unit.parent:
                payload["parent"] = {"id": to_create.org_unit.parent.source_ref}
            self.fill_geometry_or_coordinates(to_create.comparison("geometry"), payload)

            self.iaso_logger.info("will post ", payload)
            try:
                resp = api.post("organisationUnits", payload)
                self.iaso_logger.info("received ", resp.json())
            except:
                print("passing", payload)
                pass

    def fill_geometry_or_coordinates(self, comparison, payload):
        if comparison.after:
            point_or_shape = GEOSGeometry(comparison.after)
            geometry = json.loads(point_or_shape.geojson)
            # No altitude in DHIS2, remove before exporting
            # Note that [:2] works both for points and polygons: our polygons are built as a single shape of 2D points
            # (example: [[[-1.3, 2.5], [-1.7, 2.8], [-1.1, 4.1], [-1.3, 2.5]]])
            # WARNING: this will break if we introduce compound shapes
            geometry["coordinates"] = geometry["coordinates"][:2]
            # if dhis2 >= 2.32
            payload["geometry"] = geometry
            # if dhis2 < 2.32
            payload["coordinates"] = json.dumps(geometry["coordinates"])
            payload["featureType"] = to_dhis2_feature_type(geometry["type"])

    def update_orgunits(self, api, diffs):
        support_by_update_fields = ("name", "parent", "geometry")
        to_update_diffs = list(
            filter(lambda x: x.status == "modified" and x.are_fields_modified(support_by_update_fields), diffs)
        )
        self.iaso_logger.info("orgunits to update : ", len(to_update_diffs))
        to_update_diffs = sort_by_path(to_update_diffs)
        self.iaso_logger.info("modified", len(to_update_diffs))

        slices = all_slices(to_update_diffs, 4)
        index = 0
        for current_slice in slices:
            index = index + 1
            ids = list(map(lambda x: x.org_unit.source_ref, current_slice))
            filter_params = "id:in:[" + ",".join(ids) + "]"
            resp = api.get("organisationUnits?", params={"filter": filter_params, "fields": ":all"})
            dhis2_payloads = resp.json()["organisationUnits"]
            for dhis2_payload in dhis2_payloads:
                diff = [diff for diff in current_slice if diff.org_unit.source_ref == dhis2_payload["id"]]

                if len(diff) == 0:
                    raise Exception(
                        "orgunit can't be loaded from dhis2 : "
                        + dhis2_payload["id"]
                        + " vs in page loaded "
                        + ", ".join(list(map(lambda x: x["id"], dhis2_payloads)))
                    )
                diff = diff[0]
                for comparison in diff.comparisons:
                    if comparison.status != "same" and not comparison.field.startswith("groupset:"):
                        self.apply_comparison(dhis2_payload, comparison)
            # self.iaso_logger.info(" will post slice", dhis2_payloads)
            resp = api.post("metadata", {"organisationUnits": dhis2_payloads})
            self.iaso_logger.info(resp, resp.json())

    def apply_comparison(self, payload, comparison):
        # TODO ideally move to FieldTypes in comparisons.py
        if comparison.field == "name":
            payload[comparison.field] = comparison.after
            return

        if comparison.field == "geometry":
            self.fill_geometry_or_coordinates(comparison, payload)
            return

        if comparison.field == "parent" and comparison.after:
            self.fill_parent_id(comparison, payload)
            return
        raise Exception("unsupported field", comparison.field)

    def fill_parent_id(self, comparison, payload):
        if comparison.after:
            payload["parent"] = {"id": comparison.after}

    def update_groups(self, api, diffs, fields):

        support_by_update_fields = [field for field in fields if field.startswith("groupset:")]
        to_update_diffs = list(
            filter(
                lambda x: (x.status == "modified" or x.status == "new")
                and x.are_fields_modified(support_by_update_fields),
                diffs,
            )
        )

        self.iaso_logger.info("orgunits with groups to change ", len(to_update_diffs))
        if len(to_update_diffs) == 0:
            self.iaso_logger.ok("nothing to update in the groups")
            return

        groupset_field_types = as_field_types(support_by_update_fields)

        for groupset_field_type in groupset_field_types:
            self.iaso_logger.info("---", groupset_field_type.groupset_ref, groupset_field_type.groupset_name)
            dhis2_groups = api.get(
                "organisationUnitGroups",
                params={
                    "fields": ":all",
                    "filter": "groupSets.id:eq:" + groupset_field_type.groupset_ref,
                    "paging": "false",
                },
            ).json()["organisationUnitGroups"]
            for dhis2_group in dhis2_groups:
                self.iaso_logger.info("group ", dhis2_group["id"], dhis2_group["name"])
                modified = False
                for diff in to_update_diffs:
                    comparison = diff.comparison(groupset_field_type.field_name)
                    if comparison.status == "new" or comparison.status == "modified":
                        tokeep = [group["id"] for group in comparison.after if group["id"] == dhis2_group["id"]]
                        if len(tokeep) > 0:
                            if not dhis2_group_contains(dhis2_group, diff.org_unit):
                                dhis2_group["organisationUnits"].append({"id": diff.org_unit.source_ref})
                                modified = True
                                self.iaso_logger.info("\t added : ", diff.org_unit.name, diff.org_unit.source_ref)
                        else:
                            if dhis2_group_contains(dhis2_group, diff.org_unit):
                                dhis2_group["organisationUnits"] = list(
                                    filter(
                                        lambda ou: ou["id"] != diff.org_unit.source_ref,
                                        dhis2_group["organisationUnits"],
                                    )
                                )
                                modified = True
                                self.iaso_logger.info("\t removed : ", diff.org_unit.name, diff.org_unit.id)
                if modified:
                    self.iaso_logger.info("updating ", dhis2_group["id"], dhis2_group["name"])
                    resp = api.put("organisationUnitGroups/" + dhis2_group["id"], dhis2_group)
                    self.iaso_logger.info("updated  ", dhis2_group["id"], dhis2_group["name"], resp, resp.json())
        return
