import datetime
import json
import logging
import uuid

from dataclasses import dataclass
from itertools import islice
from typing import Optional

from iaso.diffing import Differ
from iaso.models import DataSourceVersionsSynchronization, Group, OrgUnit, OrgUnitChangeRequest

from .synchronizer_serializers import DataSourceVersionsSynchronizerDiffSerializer


logger = logging.getLogger(__name__)


def diffs_to_json(diffs) -> str:
    serializer = DataSourceVersionsSynchronizerDiffSerializer(diffs, many=True)
    return json.dumps(serializer.data)


@dataclass
class ChangeRequestGroups:
    change_request_id: Optional[int]
    org_unit_id: int
    old_groups_ids: set[int]
    new_groups_ids: set[int]


@dataclass
class OrgUnitMatching:
    corresponding_id: Optional[int]
    corresponding_parent_id: Optional[int]


class DataSourceVersionsSynchronizer:
    """
    The synchronization mechanism for the `DataSourceVersionsSynchronization` model.
    """

    def __init__(self, data_source_sync: DataSourceVersionsSynchronization):
        self.data_source_sync = data_source_sync

        # The JSON that we deserialized is assumed to have been serialized
        # by `iaso.diffing.dumper.DataSourceVersionsSynchronizationEncoder`.
        self.diffs = json.loads(data_source_sync.json_diff)

        self.change_requests_groups_to_bulk_create = {}
        self.change_requests_to_bulk_create = []
        self.groups_matching = {}
        self.groups_to_bulk_create = {}
        self.org_units_matching = {}
        self.org_units_to_bulk_create = []

        self.insert_batch_size = 100
        self.json_batch_size = 10

    def synchronize(self) -> None:
        self._prepare_groups_matching()
        self._create_missing_org_units_and_prepare_missing_groups()
        self._bulk_create_missing_groups()
        self._prepare_change_requests()
        self._bulk_create_change_requests()
        self._bulk_create_change_request_groups()

    @staticmethod
    def sort_by_path(diffs: list[dict]) -> list:
        sorted_list = sorted(diffs, key=lambda d: str(d["org_unit"]["path"]))
        return sorted_list

    @staticmethod
    def parse_date_str(date_str: str) -> datetime.date:
        return datetime.datetime.strptime(date_str, "%Y-%m-%d").date()

    @staticmethod
    def has_group_changes(comparisons: list[dict]) -> bool:
        return any(
            [
                comparison["status"] in [Differ.STATUS_NEW, Differ.STATUS_NOT_IN_ORIGIN]
                for comparison in comparisons
                if comparison["field"].startswith("group:")
            ]
        )

    def _prepare_groups_matching(self) -> None:
        """
        Populate the `self.groups_matching` dict.
        It's used to match `Group`s between pyramids based on the common `source_ref`.
        It will be completed later with potential new groups.
        """
        existing_groups = Group.objects.filter(source_version=self.data_source_sync.source_version_to_update).only(
            "pk", "source_ref"
        )
        for group in existing_groups:
            if not group.source_ref:
                logger.error(
                    f"Ignoring Group ID #{group.pk} because it has no `source_ref` attribute.",
                    extra={"group": group, "data_source_sync": self.data_source_sync},
                )
                continue
            self.groups_matching[group.source_ref] = group.pk

    def _create_missing_org_units_and_prepare_missing_groups(self) -> None:
        """
        Create missing `OrgUnit`s and prepare the list of missing `Group`s.

        Because of the tree structure of the `OrgUnit` model, it's hard to bulk create them.
        So we sacrifice performance for the sake of simplicity by creating the missing `OrgUnit`s in a loop.
        """
        # Cast the list into a generator to be able to iterate over it chunk by chunk.
        missing_org_units_diff_generator = (
            diff for diff in self.sort_by_path(self.diffs) if diff["status"] == Differ.STATUS_NEW
        )

        while True:
            # Get a subset of the generator.
            batch_diff = list(islice(missing_org_units_diff_generator, self.json_batch_size))

            if not batch_diff:
                break

            # Prefetch `OrgUnit`s to avoid triggering one SQL query per loop iteration.
            org_unit_ids = [diff["orgunit_ref"]["id"] for diff in batch_diff]
            org_units = OrgUnit.objects.filter(pk__in=org_unit_ids).select_related("parent").prefetch_related("groups")

            for diff in batch_diff:
                org_unit_id = diff["orgunit_ref"]["id"]
                org_unit = next(org_unit for org_unit in org_units if org_unit.id == org_unit_id)

                if not org_unit.source_ref:
                    logger.error(
                        f"Ignoring OrgUnit ID #{org_unit.pk} because it has no `source_ref` attribute.",
                        extra={"org_unit": org_unit, "data_source_sync": self.data_source_sync},
                    )
                    continue

                corresponding_parent = None
                if org_unit.parent:
                    # `get()` will always work here because `_sort_by_path()` is applied to the diff.
                    corresponding_parent = OrgUnit.objects.get(
                        source_ref=org_unit.parent.source_ref,
                        version=self.data_source_sync.source_version_to_update,
                    )

                self.org_units_matching[org_unit.source_ref] = OrgUnitMatching(
                    corresponding_id=None,  # This will be populated after the bulk creation.
                    corresponding_parent_id=corresponding_parent.pk if corresponding_parent else None,
                )

                for group in org_unit.groups.all():
                    old_pk = group.pk
                    if (
                        group.source_ref
                        and group.source_ref not in self.groups_matching.keys()
                        and old_pk not in self.groups_to_bulk_create.keys()
                    ):
                        # Duplicate the `Group` in the pyramid to update.
                        group.pk = None
                        group.source_version = self.data_source_sync.source_version_to_update
                        self.groups_to_bulk_create[old_pk] = group

                # Duplicate the `OrgUnit` in the pyramid to update.
                org_unit.pk = None
                org_unit.validation_status = org_unit.VALIDATION_NEW
                org_unit.parent = corresponding_parent
                org_unit.version = self.data_source_sync.source_version_to_update
                org_unit.uuid = uuid.uuid4()
                org_unit.creator = self.data_source_sync.created_by
                org_unit.path = None  # This will be calculated if the change request is approved.
                org_unit.save(skip_calculate_path=True)

                self.org_units_matching[org_unit.source_ref].corresponding_id = org_unit.pk

    def _bulk_create_missing_groups(self) -> None:
        # Cast the list into a generator to be able to iterate over it chunk by chunk.
        new_groups_generator = (item for item in self.groups_to_bulk_create.values())

        while True:
            new_groups_batch = list(islice(new_groups_generator, self.json_batch_size))

            if not new_groups_batch:
                break

            new_groups = Group.objects.bulk_create(new_groups_batch, self.insert_batch_size)
            for new_group in new_groups:
                self.groups_matching[new_group.source_ref] = new_group.pk

    def _prepare_change_requests(self) -> None:
        # Cast the list into a generator to be able to iterate over it chunk by chunk.
        change_requests_diff_generator = (
            diff for diff in self.diffs if diff["status"] in [Differ.STATUS_NEW, Differ.STATUS_MODIFIED]
        )

        while True:
            # Get a subset of the generator.
            batch_diff = list(islice(change_requests_diff_generator, self.json_batch_size))

            if not batch_diff:
                break

            for diff in batch_diff:
                if diff["status"] == Differ.STATUS_NEW:
                    change_request, group_changes = self._prepare_new_change_requests(diff)
                else:
                    change_request, group_changes = self._prepare_modified_change_requests(diff)

                if not change_request:
                    continue

                self.change_requests_to_bulk_create.append(change_request)

                old_groups_ids = set()
                new_groups_ids = set()
                for group_change in group_changes:
                    old_ids = [group["iaso_id"] for group in group_change["before"]] if group_change["before"] else []
                    new_ids = [group["iaso_id"] for group in group_change["after"]] if group_change["after"] else []
                    if group_change["status"] == Differ.STATUS_SAME:
                        old_groups_ids.update(old_ids)
                        new_groups_ids.update(new_ids)
                    elif group_change["status"] == Differ.STATUS_NOT_IN_ORIGIN:
                        old_groups_ids.update(old_ids)
                    elif group_change["status"] == Differ.STATUS_NEW:
                        new_groups_ids.update(new_ids)

                self.change_requests_groups_to_bulk_create[change_request.org_unit_id] = ChangeRequestGroups(
                    change_request_id=None,  # This will be populated after the bulk creation.
                    org_unit_id=change_request.org_unit_id,
                    old_groups_ids=old_groups_ids,
                    new_groups_ids=new_groups_ids,
                )

    def _prepare_new_change_requests(self, diff: dict) -> tuple[Optional[OrgUnitChangeRequest], Optional[list]]:
        org_unit = diff["orgunit_ref"]
        requested_fields = [
            f"new_{field}"
            for field in ["name", "parent", "opening_date", "closed_date"]
            if org_unit.get(field) not in [None, ""]
        ]

        if not requested_fields:
            logger.error(
                f"Ignoring OrgUnit ID #{diff['orgunit_ref']['id']} because `requested_fields` is empty.",
                extra={"diff": diff, "data_source_sync": self.data_source_sync},
            )
            return None, None

        new_name = ""
        if "new_name" in requested_fields:
            new_name = org_unit["name"]

        new_opening_date = None
        if "new_opening_date" in requested_fields:
            new_opening_date = self.parse_date_str(org_unit["opening_date"])

        new_closed_date = None
        if "new_closed_date" in requested_fields:
            new_closed_date = self.parse_date_str(org_unit["closed_date"])

        group_changes = []
        if self.has_group_changes(diff["comparisons"]):
            requested_fields.append("new_groups")
            group_changes = [
                comparison for comparison in diff["comparisons"] if comparison["field"].startswith("group:")
            ]
            for group_change in group_changes:
                new_groups = group_change["after"] if group_change["after"] else []
                # Find the corresponding `Group` ID in the pyramid to update.
                for new_group in new_groups:
                    source_ref = new_group["id"]
                    matching_iaso_id = self.groups_matching.get(source_ref)
                    if matching_iaso_id:
                        new_group["iaso_id"] = matching_iaso_id
                    else:
                        logger.error(
                            f"Unable to find a corresponding `Group` with `source_ref={source_ref}` in the pyramid to update.",
                            extra={"new_group": new_group, "data_source_sync": self.data_source_sync},
                        )

        try:
            matching = self.org_units_matching[org_unit["source_ref"]]
        except KeyError:
            # This happens for org units skipped in `_create_missing_org_units_and_prepare_missing_groups`
            # when they have no `source_ref` attribute.
            return None, None

        org_unit_change_request = OrgUnitChangeRequest(
            # Data.
            kind=OrgUnitChangeRequest.Kind.ORG_UNIT_CREATION,
            created_by=self.data_source_sync.created_by,
            requested_fields=requested_fields,
            data_source_synchronization=self.data_source_sync,
            org_unit_id=matching.corresponding_id,
            # No old values because we are creating a new org unit.
            old_parent_id=None,
            old_name="",
            old_org_unit_type_id=None,
            old_location=None,
            old_opening_date=None,
            old_closed_date=None,
            # New values.
            new_parent_id=matching.corresponding_parent_id,
            new_name=new_name,
            new_opening_date=new_opening_date,
            new_closed_date=new_closed_date,
        )

        return org_unit_change_request, group_changes

    def _prepare_modified_change_requests(self, diff: dict) -> tuple[OrgUnitChangeRequest, list]:
        changes = {
            comparison["field"]: comparison["after"]
            for comparison in diff["comparisons"]
            if comparison["status"] == Differ.STATUS_MODIFIED
            and comparison["field"] in ["name", "parent", "opening_date", "closed_date"]
        }

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
            new_opening_date = self.parse_date_str(changes["opening_date"])
            requested_fields.append("new_opening_date")

        if changes.get("closed_date"):
            new_closed_date = self.parse_date_str(changes["closed_date"])
            requested_fields.append("new_closed_date")

        group_changes = []
        if self.has_group_changes(diff["comparisons"]):
            requested_fields.append("new_groups")
            group_changes = [
                comparison for comparison in diff["comparisons"] if comparison["field"].startswith("group:")
            ]

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
        change_requests_generator = (item for item in self.change_requests_to_bulk_create)

        while True:
            change_requests_batch = list(islice(change_requests_generator, self.insert_batch_size))

            if not change_requests_batch:
                break

            change_requests = OrgUnitChangeRequest.objects.bulk_create(change_requests_batch, self.insert_batch_size)

            for change_request in change_requests:
                groups_to_bulk_create = self.change_requests_groups_to_bulk_create.get(change_request.org_unit_id)
                if groups_to_bulk_create:
                    # Link groups related to the newly created change request.
                    groups_to_bulk_create.change_request_id = change_request.pk

    def _bulk_create_change_request_groups(self) -> None:
        """
        Use the "through" table to bulk update old and new groups (m2m).
        """
        old_groups = []
        new_groups = []

        for groups_info in self.change_requests_groups_to_bulk_create.values():
            for old_group_id in groups_info.old_groups_ids:
                old_groups.append(
                    OrgUnitChangeRequest.old_groups.through(
                        orgunitchangerequest_id=groups_info.change_request_id, group_id=old_group_id
                    )
                )
            for new_group_id in groups_info.new_groups_ids:
                new_groups.append(
                    OrgUnitChangeRequest.new_groups.through(
                        orgunitchangerequest_id=groups_info.change_request_id, group_id=new_group_id
                    )
                )

        old_groups_generator = (group for group in old_groups)
        while True:
            old_groups_batch = list(islice(old_groups_generator, self.insert_batch_size))
            if not old_groups_batch:
                break
            OrgUnitChangeRequest.old_groups.through.objects.bulk_create(old_groups_batch, self.insert_batch_size)

        new_groups_generator = (group for group in new_groups)
        while True:
            new_groups_batch = list(islice(new_groups_generator, self.insert_batch_size))
            if not new_groups_batch:
                break
            OrgUnitChangeRequest.new_groups.through.objects.bulk_create(new_groups_batch, self.insert_batch_size)
