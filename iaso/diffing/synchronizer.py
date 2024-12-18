import datetime
import json
import logging
import uuid

from itertools import islice

from iaso.models import OrgUnit, OrgUnitChangeRequest, DataSourceSynchronization

logger = logging.getLogger(__name__)


class Synchronizer:
    def __init__(self, data_source_sync: DataSourceSynchronization):
        self.data_source_sync = data_source_sync
        self.diffs = json.loads(data_source_sync.json_diff)
        self.insert_batch_size = 100
        self.json_batch_size = 10
        self.groups_for_change_requests = []
        self.change_requests = []
        self.org_units = []
        self.org_units_matching = {}

    def synchronize(self) -> None:
        self._prepare_missing_org_units()
        self._bulk_create_missing_org_units()
        self._prepare_change_requests()
        self._bulk_create_change_requests()
        self._bulk_create_change_request_groups()

    def _sort_by_path(self, diffs: dict) -> list:
        sorted_list = sorted(diffs, key=lambda d: str(d["org_unit"]["path"]), reverse=True)
        return sorted_list

    def _parse_date(self, date_str: str) -> datetime.date:
        return datetime.datetime.strptime(date_str, "%Y-%m-%d").date()

    def _prepare_missing_org_units(self) -> None:
        # Cast the list into a generator to be able to iterate over it chunk by chunk.
        missing_org_units_diff_generator = (diff for diff in self._sort_by_path(self.diffs) if diff["status"] == "new")

        while True:
            # Get a subset of the generator.
            batch_diff = list(islice(missing_org_units_diff_generator, self.json_batch_size))

            if not batch_diff:
                break

            for diff in batch_diff:
                org_unit = diff["orgunit_ref"]
                org_unit = OrgUnit.objects.select_related("parent").get(pk=org_unit["id"])

                new_parent = None
                if org_unit.parent:
                    new_parent = OrgUnit.objects.get(
                        source_ref=org_unit.parent.source_ref, version=self.data_source_sync.source_version_to_update
                    )

                self.org_units_matching[org_unit.source_ref] = {
                    "new_id": None,  # This doesn't exist yet.
                    "new_parent": new_parent,
                    "old_id": org_unit.pk,
                }

                # Duplicate the `OrgUnit` in the source version to update.
                org_unit.pk = None
                org_unit.parent = new_parent
                org_unit.version = self.data_source_sync.source_version_to_update
                org_unit.validation_status = org_unit.VALIDATION_NEW
                org_unit.uuid = uuid.uuid4()
                org_unit.creator = self.data_source_sync.created_by
                org_unit.path = None

                self.org_units.append(org_unit)

    def _bulk_create_missing_org_units(self) -> None:
        # Cast the list into a generator to be able to iterate over it chunk by chunk.
        new_org_units_generator = (item for item in self.org_units)

        while True:
            batch = list(islice(new_org_units_generator, self.insert_batch_size))

            if not batch:
                break

            new_org_units = OrgUnit.objects.bulk_create(batch, self.insert_batch_size)
            for new_org_unit in new_org_units:
                self.org_units_matching[new_org_unit.source_ref]["new_id"] = new_org_unit.pk

    def _prepare_change_requests(self) -> None:
        # Cast the list into a generator to be able to iterate over it chunk by chunk.
        change_requests_diff_generator = (diff for diff in self.diffs if diff["status"] in ["new", "modified"])

        while True:
            # Get a subset of the generator.
            batch_diff = list(islice(change_requests_diff_generator, self.json_batch_size))

            if not batch_diff:
                break

            for diff in batch_diff:
                if diff["status"] == "new":
                    change_request, group_changes = self._prepare_new_change_requests(diff)
                else:
                    change_request, group_changes = self._prepare_modified_change_requests(diff)

                if not change_request:
                    continue

                self.change_requests.append(change_request)

                if group_changes:
                    self.groups_for_change_requests.append(
                        {
                            "change_request_id": None,  # This doesn't exist yet.
                            "org_unit_id": change_request.org_unit_id,
                            "old_groups_ids": {
                                group["iaso_id"] for group_change in group_changes for group in group_change["before"]
                            },
                            "new_groups_ids": {
                                group["iaso_id"] for group_change in group_changes for group in group_change["after"]
                            },
                        }
                    )

    def _prepare_new_change_requests(self, diff):
        # TODO: groups.
        group_changes = None

        org_unit = diff["orgunit_ref"]
        requested_fields = [
            f"new_{field}"
            for field in ["name", "parent", "opening_date", "closed_date"]
            if org_unit.get(field) not in [None, ""]
        ]

        if not requested_fields:
            logger.error("Empty `requested_fields`", extra={"diff": diff, "data_source_sync": self.data_source_sync})
            return None, None

        new_name = ""
        if "new_name" in requested_fields:
            new_name = org_unit["name"]

        new_opening_date = None
        if "new_opening_date" in requested_fields:
            new_opening_date = self._parse_date(org_unit["opening_date"])

        new_closed_date = None
        if "new_closed_date" in requested_fields:
            new_closed_date = self._parse_date(org_unit["closed_date"])

        if group_changes:
            requested_fields.append("new_groups")

        org_unit_change_request = OrgUnitChangeRequest(
            # Data.
            kind=OrgUnitChangeRequest.Kind.ORG_UNIT_CREATION,
            created_by=self.data_source_sync.created_by,
            requested_fields=requested_fields,
            data_source_synchronization=self.data_source_sync,
            org_unit_id=self.org_units_matching[org_unit["source_ref"]]["new_id"],
            # Old values.
            old_parent_id=None,
            old_name="",
            old_org_unit_type_id=None,
            old_location=None,
            old_opening_date=None,
            old_closed_date=None,
            # New values.
            new_parent=self.org_units_matching[org_unit["source_ref"]]["new_parent"],
            new_name=new_name,
            new_opening_date=new_opening_date,
            new_closed_date=new_closed_date,
        )

        return org_unit_change_request, group_changes

    def _prepare_modified_change_requests(self, diff):
        changes = {
            comparison["field"]: comparison["after"]
            for comparison in diff["comparisons"]
            if comparison["status"] == "modified"
            and comparison["field"] in ["name", "parent", "opening_date", "closed_date"]
        }

        group_changes = [
            comparison
            for comparison in diff["comparisons"]
            if comparison["status"] == "modified" and comparison["field"].startswith("group")
        ]

        org_unit = diff["orgunit_dhis2"]
        requested_fields = []
        new_parent = None
        new_name = ""
        new_opening_date = None
        new_closed_date = None

        if changes.get("parent"):
            new_parent = changes["parent"]
            requested_fields.append("new_parent")

        if changes.get("name"):
            new_name = changes["name"]
            requested_fields.append("new_name")

        if changes.get("opening_date"):
            new_opening_date = self._parse_date(changes["opening_date"])
            requested_fields.append("new_opening_date")

        if changes.get("closed_date"):
            new_closed_date = self._parse_date(changes["closed_date"])
            requested_fields.append("new_closed_date")

        if group_changes:
            requested_fields.append("new_groups")

        org_unit_change_request = OrgUnitChangeRequest(
            # Data.
            kind=OrgUnitChangeRequest.Kind.ORG_UNIT_CHANGE,
            created_by=self.data_source_sync.created_by,
            requested_fields=requested_fields,
            data_source_synchronization=self.data_source_sync,
            org_unit_id=org_unit["id"],
            # Old values.
            old_parent_id=org_unit.get("parent"),
            old_name=org_unit.get("name", ""),
            old_org_unit_type_id=org_unit.get("org_unit_type"),
            old_location=org_unit.get("location"),
            old_opening_date=org_unit.get("opening_date"),
            old_closed_date=org_unit.get("closed_date"),
            # New values.
            new_parent=new_parent,
            new_name=new_name,
            new_opening_date=new_opening_date,
            new_closed_date=new_closed_date,
        )

        return org_unit_change_request, group_changes

    def _bulk_create_change_requests(self) -> None:
        # Cast the list into a generator to be able to iterate over it chunk by chunk.
        new_change_requests_generator = (item for item in self.change_requests)

        while True:
            batch = list(islice(new_change_requests_generator, self.insert_batch_size))

            if not batch:
                break

            change_requests = OrgUnitChangeRequest.objects.bulk_create(batch, self.insert_batch_size)

            # Assign each group to the correct change request.
            for change_request in change_requests:
                groups_change_request = next(
                    (cr for cr in self.groups_for_change_requests if cr["org_unit_id"] == change_request.org_unit_id),
                    None,
                )
                if groups_change_request:
                    groups_change_request["change_request_id"] = change_request.id

    def _bulk_create_change_request_groups(self) -> None:
        old_groups = []
        new_groups = []

        for groups in self.groups_for_change_requests:
            for old_group_id in groups["old_groups_ids"]:
                old_groups.append(
                    OrgUnitChangeRequest.old_groups.through(
                        orgunitchangerequest_id=groups["change_request_id"], group_id=old_group_id
                    )
                )
            for new_group_id in groups["new_groups_ids"]:
                new_groups.append(
                    OrgUnitChangeRequest.new_groups.through(
                        orgunitchangerequest_id=groups["change_request_id"], group_id=new_group_id
                    )
                )

        # Use the through table to bulk update old and new groups (m2m).
        OrgUnitChangeRequest.old_groups.through.objects.bulk_create(old_groups)
        OrgUnitChangeRequest.new_groups.through.objects.bulk_create(new_groups)
