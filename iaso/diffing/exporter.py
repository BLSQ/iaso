import json

from iaso.models import generate_id_for_dhis_2
from django.contrib.gis.geos import GEOSGeometry


def all_slices(iterables, size: int):
    batch = 0
    slices = []
    while batch * size < len(iterables):
        slices.append(iterables[batch * size : (batch + 1) * size])
        batch += 1

    return slices


class Exporter:
    def __init__(self, logger):
        self.iaso_logger = logger

    def export_to_dhis2(self, api, diffs):
        self.iaso_logger.ok("   ------ New ----")
        self.create_missings(api, diffs)
        self.iaso_logger.ok("   ------ Modified ----")
        self.update_orgunits(api, diffs)

    def create_missings(self, api, diffs):
        to_create_diffs = list(filter(lambda x: x.status == "new", diffs))

        self.assign_dhis2_ids(to_create_diffs)
        to_create_diffs = self.sort_by_path(to_create_diffs)

        # build the "minimal" payloads for creation, groups only done at later stage
        for to_create in to_create_diffs:
            name_comparison = to_create.comparison("name")
            print("----", name_comparison.after, to_create.org_unit.path())

            payload = {
                "id": to_create.org_unit.source_ref,
                "name": name_comparison.after,
                "shortName": name_comparison.after,
                "openingDate": "1960-08-03T00:00:00.000",
            }

            self.fill_parent_id(to_create, payload)
            self.fill_geometry_or_coordinates(to_create, payload)

            self.iaso_logger.info("will post ", payload)
            resp = api.post("organisationUnits", payload)
            self.iaso_logger.info("received ", resp.json())

    def fill_parent_id(self, to_create, payload):
        if to_create.org_unit.parent:
            payload["parent"] = {"id": to_create.org_unit.parent.source_ref}

    def fill_geometry_or_coordinates(self, to_create, payload):
        geometry_comparison = to_create.comparison("geometry")
        if geometry_comparison.after:
            point_or_shape = GEOSGeometry(geometry_comparison.after)
            geometry = json.loads(point_or_shape.geojson)
            # if dhis2 >= 2.32
            payload["geometry"] = geometry
            # if dhis2 < 2.32
            payload["coordinates"] = geometry["coordinates"]
            payload["featureType"] = self.to_dhis2_feature_type(geometry["type"])

    def sort_by_path(self, diffs):
        def by_path(ou):
            path = ou.path()
            return path if path else ""

        # make sure we create new parent first
        return sorted(diffs, key=lambda d: by_path(d.org_unit))

    def assign_dhis2_ids(self, to_create_diffs):
        # ideally should run on diff
        # assign source_ref for orgunits to avoid double creation
        for to_create in to_create_diffs:
            if to_create.org_unit.source_ref is None:
                to_create.org_unit.source_ref = generate_id_for_dhis_2()
                to_create.org_unit.save()

        for to_create in to_create_diffs:
            to_create.org_unit.refresh_from_db()

    def to_dhis2_feature_type(self, type):
        # TODO better way : to snake case upper case ?
        if type == "Point":
            return "POINT"

        if type == "Polygon":
            return "POLYGON"

        if type == "MultiPolygon":
            return "MULTI_POLYGON"

    def update_orgunits(self, api, diffs):
        support_by_update_fields = ("name", "parent", "geometry")
        to_update_diffs = list(
            filter(
                lambda x: x.status == "modified"
                and x.are_fields_modified(support_by_update_fields),
                diffs,
            )
        )
        print("to_update_diffs", len(to_update_diffs))
        to_update_diffs = self.sort_by_path(to_update_diffs)
        self.iaso_logger.info("modified", len(to_update_diffs))

        slices = all_slices(to_update_diffs, 5)
        index = 0
        for current_slice in slices:
            index = index + 1
            ids = list(map(lambda x: x.org_unit.source_ref, current_slice))
            filter_params = "id:in:[" + ",".join(ids) + "]"
            resp = api.get(
                "organisationUnits?", params={"filter": filter_params, "fields": ":all"}
            )
            dhis2_payloads = resp.json()["organisationUnits"]
            for dhis2_payload in dhis2_payloads:
                diff = [
                    diff
                    for diff in current_slice
                    if diff.org_unit.source_ref == dhis2_payload["id"]
                ]

                if len(diff) == 0:
                    raise Exception(
                        "orgunit can't be loaded : "
                        + dhis2_payload["id"]
                        + "  "
                        + str(dhis2_payloads)
                    )
                diff = diff[0]
                for comparison in diff.comparisons:
                    if comparison.status != "same" and not comparison.field.startswith(
                        "groupset:"
                    ):
                        self.apply_comparison(dhis2_payload, comparison)
            self.iaso_logger.info(" will post slice", dhis2_payloads)
            resp = api.post("metadata", {"organisationUnits": dhis2_payloads})
            self.iaso_logger.info(resp, resp.json())

    def apply_comparison(self, payload, comparison):
        if comparison.field == "name":
            payload[comparison.field] = comparison.after
            return
        if comparison.field == "geometry":
            point_or_shape = GEOSGeometry(comparison.after)
            geometry = json.loads(point_or_shape.geojson)
            payload["geometry"] = geometry

            payload["coordinates"] = geometry["coordinates"]
            payload["featureType"] = self.to_dhis2_feature_type(geometry["type"])
            return
        raise Exception("unsupported field", comparison.field)
