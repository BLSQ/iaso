import json

from typing import List

import dhis2.exceptions

from dhis2 import Api
from django.contrib.gis.geos import GEOSGeometry

from iaso.models import generate_id_for_dhis_2

from .comparisons import Comparison, Diff, as_field_types


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


def format_error(action, exc, errors):
    message = f"Error when {action}\nURL : {exc.url}\nReceived status code: {exc.code}\n"
    if errors:
        message += "Errors:\r\n"
        for error in errors:
            message += " * " + error + "\n"
    return message


class Exporter:
    def __init__(self, logger):
        self.iaso_logger = logger

    def export_to_dhis2(self, api: Api, diffs: List[Diff], fields, task=None):
        if task:
            task.report_progress_and_stop_if_killed(
                progress_message="Creating new Org Units", progress_value=0, end_value=3
            )
        self.iaso_logger.ok("   ------ New org units----")
        self.create_missings(api, diffs)
        if task:
            task.report_progress_and_stop_if_killed(
                progress_message="Modifying existing Org Units", progress_value=1, end_value=3
            )
        self.iaso_logger.ok("   ------ Modified org units----")
        self.update_orgunits(api, diffs)
        if task:
            task.report_progress_and_stop_if_killed(progress_message="Updating groups", progress_value=3, end_value=3)
        self.iaso_logger.ok("   ------ Modified groups----")
        self.update_groups_with_groupsets(api, diffs, fields)
        self.update_groups_without_groupsets(api, diffs, fields)

    def create_missings(self, api, diffs: List[Diff], task=None):
        to_create_diffs = list(filter(lambda x: x.status == "new", diffs))
        self.iaso_logger.info("orgunits to create : ", len(to_create_diffs))

        assign_dhis2_ids(to_create_diffs)
        to_create_diffs = sort_by_path(to_create_diffs)
        if task:
            task.report_progress_and_stop_if_killed(
                progress_message="Creating Orgunits", progress_value=0, end_value=len(to_create_diffs)
            )
        # build the "minimal" payloads for creation, groups only done at later stage
        index = 0
        for to_create in to_create_diffs:
            name_comparison = to_create.comparison("name")

            if name_comparison is None:
                raise Exception("can't create missing orgunit " + to_create.org_unit.path)

            self.iaso_logger.info("----", name_comparison.after, to_create.org_unit.path)

            payload = {
                "id": to_create.org_unit.source_ref,
                "name": name_comparison.after,
                "shortName": name_comparison.after[:50],
                "openingDate": "1960-08-03T00:00:00.000",
            }

            if to_create.org_unit.opening_date:
                payload["openingDate"] = to_create.org_unit.opening_date.strftime("%Y-%m-%d") + "T00:00:00.000"

            if to_create.org_unit.parent:
                payload["parent"] = {"id": to_create.org_unit.parent.source_ref}

            self.fill_geometry_or_coordinates(to_create.comparison("geometry"), payload)

            self.iaso_logger.info("will post ", payload)

            try:
                resp = api.post("organisationUnits", payload)
            except dhis2.exceptions.RequestException as exc:
                errors = []
                try:
                    if exc.code != 404:
                        error_dict = json.loads(exc.description).get("response", {})
                        for error_report in error_dict.get("errorReports", []):
                            errors.append(error_report.get("message", str(error_report)))
                except:
                    pass
                exc.message = format_error(f"Error when creating Org Unit {to_create.org_unit}", exc, errors)
                exc.extra = {"payload": json.dumps(payload, indent=4), "response": exc.description}
                raise exc

            self.iaso_logger.info("received ", resp.json())
            index = index + 1
            if task and index % 10 == 0:
                task.report_progress_and_stop_if_killed(progress_message="Creating Orgunits", progress_value=index)

    def fill_geometry_or_coordinates(self, comparison, payload):
        if comparison and comparison.after:
            point_or_shape = GEOSGeometry(comparison.after)
            geometry = json.loads(point_or_shape.geojson)
            if json.loads(point_or_shape.geojson).get("type") == "Point":
                # removing altitude, which is not supported by DHIS2
                geometry["coordinates"] = geometry["coordinates"][:2]

            # if dhis2 >= 2.32
            payload["geometry"] = geometry
            # if dhis2 < 2.32
            payload["coordinates"] = json.dumps(geometry["coordinates"])
            payload["featureType"] = to_dhis2_feature_type(geometry["type"])

    def update_orgunits(self, api: Api, diffs: List[Diff], task=None):
        support_by_update_fields = ("name", "parent", "geometry", "opening_date", "closed_date")
        to_update_diffs = list(
            filter(lambda x: x.status == "modified" and x.are_fields_modified(support_by_update_fields), diffs)
        )
        self.iaso_logger.info("orgunits to update : ", len(to_update_diffs))
        to_update_diffs = sort_by_path(to_update_diffs)

        slices = all_slices(to_update_diffs, 4)
        if task:
            task.report_progress_and_stop_if_killed(
                progress_message="Updating Orgunits", progress_value=0, end_value=len(slices)
            )
        index = 0
        for current_slice in slices:
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
                for comparison in diff.comparisons:  # type: ignore
                    if comparison.status != "same" and not comparison.field.startswith(("group:", "groupset:")):
                        self.apply_comparison(dhis2_payload, comparison)
            self.iaso_logger.info(f"will post slice for {', '.join(ids)}")
            # pprint([{k: (v if k != "geometry" else "...") for k, v in payload.items()} for payload in dhis2_payloads])
            payload = {"organisationUnits": dhis2_payloads}
            try:
                resp = api.post("metadata", payload)
            except dhis2.exceptions.RequestException as exc:
                errors = []
                try:
                    if exc.code != 404:
                        error_dict = json.loads(exc.description).get("response", {})
                        for error_report in error_dict.get("errorReports", []):
                            errors.append(error_report.get("message", str(error_report)))
                except:
                    pass
                exc.message = format_error(f"updating Org Units {','.join(ids)}", exc, errors)
                exc.extra = {"payload": json.dumps(payload, indent=4), "response": resp.text}
                raise exc

            self.iaso_logger.info(resp)
            report = resp.json()

            if resp.status_code == 200 and report["status"] == "ERROR":
                my_exc = dhis2.exceptions.RequestException(code=resp.status_code, url=resp.url, description=resp.text)
                errors = []
                try:
                    for type_report in report.get("typeReports", []):
                        for object_report in type_report.get("objectReports", []):
                            for error_report in object_report.get("errorReports", []):
                                errors.append(error_report.get("message", str(error_report)))
                except:
                    pass
                my_exc.message = format_error(f"updating Org Units {','.join(ids)}", my_exc, errors)
                my_exc.extra = {"payload": json.dumps(payload, indent=4), "response": resp.text}
                raise my_exc

            index = index + 1
            if task and index % 10 == 0:
                task.report_progress_and_stop_if_killed(progress_message="Updating Orgunits", progress_value=index)

    def fill_in_date(self, field_name: str, dhis_field_name: str, comparison: Comparison, payload):
        if comparison.field == field_name and comparison.after is None:
            payload[dhis_field_name] = None
            return

        if comparison.field == field_name and comparison.after:
            payload[dhis_field_name] = comparison.after.strftime("%Y-%m-%dT%H:%M:%S")
            return

    def apply_comparison(self, payload, comparison: Comparison):
        # TODO ideally move to FieldTypes in comparisons.py
        if comparison.field == "name":
            payload[comparison.field] = comparison.after
            return

        if comparison.field == "geometry" and comparison.after is None:
            payload["geometry"] = None
            payload["coordinates"] = None
            return
        if comparison.field == "geometry":
            self.fill_geometry_or_coordinates(comparison, payload)
            return

        if comparison.field == "parent" and comparison.after:
            self.fill_parent_id(comparison, payload)
            return

        if comparison.field == "opening_date":
            self.fill_in_date("opening_date", "openingDate", comparison, payload)
            return

        if comparison.field == "closed_date":
            self.fill_in_date("closed_date", "closedDate", comparison, payload)
            return

        raise Exception("unsupported field", comparison.field)

    def fill_parent_id(self, comparison: Comparison, payload):
        if comparison.after:
            payload["parent"] = {"id": comparison.after}

    def update_groups_with_groupsets(self, api, diffs: List[Diff], fields):
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
                    if comparison.status == "deleted":
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

    def update_groups_without_groupsets(self, api, diffs: List[Diff], fields):
        support_by_update_fields = [field for field in fields if field.startswith("group:")]
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

        group_field_types = as_field_types(support_by_update_fields)

        for group_field_type in group_field_types:
            self.iaso_logger.info("---", group_field_type.group_ref, group_field_type.group_name)
            dhis2_groups = api.get(
                "organisationUnitGroups",
                params={
                    "fields": ":all",
                    "filter": "id:eq:" + group_field_type.group_ref,
                    "paging": "false",
                },
            ).json()["organisationUnitGroups"]

            for dhis2_group in dhis2_groups:
                modified = False
                for diff in to_update_diffs:
                    comparison = diff.comparison(group_field_type.field_name)
                    if comparison.status == "new" or comparison.status == "modified":
                        tokeep = [group["id"] for group in comparison.after if group["id"] == dhis2_group["id"]]
                        if len(tokeep) > 0:
                            if not dhis2_group_contains(dhis2_group, diff.org_unit):
                                dhis2_group["organisationUnits"].append({"id": diff.org_unit.source_ref})
                                modified = True
                        else:
                            if dhis2_group_contains(dhis2_group, diff.org_unit):
                                dhis2_group["organisationUnits"] = list(
                                    filter(
                                        lambda ou: ou["id"] != diff.org_unit.source_ref,
                                        dhis2_group["organisationUnits"],
                                    )
                                )
                                modified = True
                    if comparison.status == "deleted":
                        if dhis2_group_contains(dhis2_group, diff.org_unit):
                            dhis2_group["organisationUnits"] = list(
                                filter(
                                    lambda ou: ou["id"] != diff.org_unit.source_ref,
                                    dhis2_group["organisationUnits"],
                                )
                            )
                            modified = True

                if modified:
                    self.iaso_logger.info("updating ", dhis2_group["id"], dhis2_group["name"])
                    resp = api.put("organisationUnitGroups/" + dhis2_group["id"], dhis2_group)
                    self.iaso_logger.info("updated  ", dhis2_group["id"], dhis2_group["name"], resp, resp.json())
