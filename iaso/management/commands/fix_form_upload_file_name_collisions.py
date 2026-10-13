"""
Repair of the submissions mixed up by `form_upload()` when two phones generate the same xml file name
(`<form id>_<version>_<timestamp>.xml`, at second precision).

`import_data()` (POST /api/instances/) gives the second instance a `<name>_dup_<uuid>.xml` file name, but
`form_upload()` only matches on the original file name: the second phone's xml lands on the first phone's instance
(overwriting its file, `created_by` and `last_modified_by`, its json staying from the first xml received) and the
`_dup_` instance stays without file nor json.

The xmls are still in the storage and the audit logs tell who uploaded which one: see `plan_group_repair()`.
Dry run unless --apply:

    docker compose run --rm iaso manage fix_form_upload_file_name_collisions --form-id 1782 --created-from 2026-10-01
    docker compose run --rm iaso manage fix_form_upload_file_name_collisions --form-id 1782 --created-from 2026-10-01 --apply

To try it on one group first: --instance-id 9570993 (or --limit 1)

With --apply, a zip of the instances as they were (and of the plan) is uploaded to the instances' storage before
anything is changed. To restore: download it, unzip it and `manage loaddata instances.json` (raw saves: no audit
log for the restore itself, the repair's audit logs keep the values from before it).
Every repaired instance gets an audit log (source "FILE NAME COLLISION REPAIR"), by the user given with --username.
"""

import json
import logging
import re
import zipfile

from copy import deepcopy
from dataclasses import asdict, dataclass, field
from datetime import datetime
from io import BytesIO
from typing import Optional

from django.contrib.auth.models import User
from django.contrib.contenttypes.models import ContentType
from django.core import serializers
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import connection, transaction
from django.utils import timezone

from hat.audit.models import Modification, log_modification
from iaso.models import Instance


logger = logging.getLogger(__name__)

SYNC_FORM_UPLOAD = "SYNC FORM UPLOAD"
REPAIR_SOURCE = "FILE NAME COLLISION REPAIR"
BACKUP_PREFIX = "fix_form_upload_file_name_collisions"

INSTANCE_ID_RE = re.compile(r"<instanceID>\s*([^<\s]+)\s*</instanceID>")
DEPRECATED_ID_RE = re.compile(r"<deprecatedID>\s*([^<\s]+)\s*</deprecatedID>")

# Groups of instances sharing an original file name, starting from the `_dup_` ones: the `position()` pre-filter
# keeps it to the file names that actually collided instead of every instance of the period.
GROUPS_SQL = r"""
WITH dups AS (
    SELECT DISTINCT d.form_id,
           regexp_replace(d.file_name, '_dup_[0-9a-fA-F-]+(\.xml)$', '\1') AS original_file_name
    FROM iaso_instance d
    WHERE d.created_at >= %(created_from)s
      AND d.created_at <= %(created_to)s
      AND (%(form_id)s::int IS NULL OR d.form_id = %(form_id)s::int)
      AND position('_dup_' in d.file_name) > 0
)
SELECT dups.form_id,
       dups.original_file_name,
       array_agg(i.id ORDER BY i.id) AS instance_ids
FROM dups
JOIN iaso_instance i
  ON i.form_id = dups.form_id
 AND (i.file_name = dups.original_file_name
      OR starts_with(i.file_name, left(dups.original_file_name, -4) || '_dup_'))
GROUP BY dups.form_id, dups.original_file_name
HAVING count(DISTINCT i.uuid) > 1
ORDER BY dups.form_id, dups.original_file_name
"""


@dataclass
class InstanceRepair:
    instance_id: int
    current_file: Optional[str]
    file: str
    created_by_id: Optional[int]
    last_modified_by_id: Optional[int]


@dataclass
class GroupRepair:
    repairs: list = field(default_factory=list)
    problems: list = field(default_factory=list)


def find_collision_groups(created_from, created_to, form_id=None):
    """[(form_id, original_file_name, [instance ids])]"""
    with connection.cursor() as cursor:
        cursor.execute(GROUPS_SQL, {"created_from": created_from, "created_to": created_to, "form_id": form_id})
        return cursor.fetchall()


def load_group(instance_ids):
    """
    The group as a dict, the same shape as the manifests of `collect_file_name_collisions.py`:
        {"instances": [{"instance": {"id", "file", "created_by_id", "json"},
                        "api_import": {"user_id"} | None,
                        "logs": [{"id", "created_at", "source", "user_id", "new_value"}]}],
         "xmls": [{"path", "content"}]}
    """
    instance_content_type = ContentType.objects.get_for_model(Instance)
    instances = Instance.objects.filter(id__in=instance_ids).select_related("api_import").order_by("id")
    logs = Modification.objects.filter(
        content_type=instance_content_type, object_id__in=[str(instance_id) for instance_id in instance_ids]
    ).order_by("created_at", "id")

    group = {"instances": [], "xmls": []}
    paths = set()
    for instance in instances:
        instance_logs = [
            {
                "id": log.id,
                "created_at": log.created_at,
                "source": log.source,
                "user_id": log.user_id,
                "new_value": log.new_value,
            }
            for log in logs
            if log.object_id == str(instance.id)
        ]
        paths.update(path for path in map(_written_file, instance_logs) if path)
        group["instances"].append(
            {
                "instance": {
                    "id": instance.id,
                    "file": instance.file.name or None,
                    "created_by_id": instance.created_by_id,
                    "json": instance.json,
                },
                "api_import": {"user_id": instance.api_import.user_id} if instance.api_import else None,
                "logs": instance_logs,
            }
        )

    storage = Instance._meta.get_field("file").storage
    for path in sorted(paths):
        try:
            with storage.open(path, "rb") as xml_file:
                group["xmls"].append({"path": path, "content": xml_file.read().decode("utf-8")})
        except OSError as error:
            logger.warning("Could not read %s: %r", path, error)
    return group


def _xml_id(content, regex):
    match = regex.search(content or "")
    return match.group(1) if match else None


def _written_file(log):
    """Storage path of the xml this log wrote on the instance, if any."""
    new_values = log.get("new_value") or []
    return (new_values[0].get("fields") or {}).get("file") if new_values else None


def plan_group_repair(group) -> GroupRepair:
    """
    Gives every xml of the group back to its instance:
    - an xml received by `form_upload()` belongs to the instance its uploader created via POST /api/instances/
    - an xml edited on the web (Enketo) belongs to the instance of the xml it was edited from (`<deprecatedID>`)
    Each instance then gets its latest xml. Nothing is planned for a group with a problem.
    """
    plan = GroupRepair()
    instance_id_by_user = {}
    for entry in group["instances"]:
        user_id = (entry["api_import"] or {}).get("user_id")
        if user_id in instance_id_by_user:
            plan.problems.append(f"user {user_id} created several instances of the group")
        elif user_id:
            instance_id_by_user[user_id] = entry["instance"]["id"]

    content_by_path = {xml["path"]: xml["content"] for xml in group["xmls"]}
    writes = sorted(
        (log["created_at"], log["id"], log["source"], log["user_id"], _written_file(log))
        for entry in group["instances"]
        for log in entry["logs"]
        if _written_file(log)
    )

    owner_by_path, writer_by_path, owner_by_xml_id = {}, {}, {}
    for _created_at, _log_id, source, user_id, path in writes:
        if path in owner_by_path:
            continue  # same file saved again (e.g. an edit of other fields)
        if path not in content_by_path:
            plan.problems.append(f"xml {path} could not be read")
            continue
        if source == SYNC_FORM_UPLOAD:
            owner = instance_id_by_user.get(user_id)
        else:
            owner = owner_by_xml_id.get(_xml_id(content_by_path[path], DEPRECATED_ID_RE))
        if owner is None:
            plan.problems.append(f"no instance for xml {path} ({source} by user {user_id})")
            continue
        owner_by_path[path] = owner
        writer_by_path[path] = (source, user_id)
        owner_by_xml_id[_xml_id(content_by_path[path], INSTANCE_ID_RE)] = owner

    for entry in group["instances"]:
        instance = entry["instance"]
        owned_paths = [path for path, owner in owner_by_path.items() if owner == instance["id"]]
        if not owned_paths:
            if instance["file"]:
                plan.problems.append(f"instance {instance['id']} has a file but none of the xmls is its own")
            continue  # its xml never arrived: nothing to give back
        uploaders = [writer_by_path[path][1] for path in owned_paths if writer_by_path[path][0] == SYNC_FORM_UPLOAD]
        repair = InstanceRepair(
            instance_id=instance["id"],
            current_file=instance["file"],
            file=owned_paths[-1],
            created_by_id=uploaders[0] if uploaders else instance["created_by_id"],
            last_modified_by_id=writer_by_path[owned_paths[-1]][1],
        )
        json_xml_id = (instance["json"] or {}).get("instanceID")
        if (
            repair.file != repair.current_file
            or repair.created_by_id != instance["created_by_id"]
            or json_xml_id != _xml_id(content_by_path[repair.file], INSTANCE_ID_RE)
        ):
            plan.repairs.append(repair)

    if plan.problems:
        plan.repairs = []
    return plan


def apply_instance_repair(repair: InstanceRepair, xml_content: bytes, user=None) -> bool:
    """Points the instance to its xml (already in the storage) and recomputes what derives from it."""
    with transaction.atomic():
        instance = Instance.objects.select_for_update().get(id=repair.instance_id)
        if (instance.file.name or None) != repair.current_file:
            return False  # changed since the plan
        old_instance = deepcopy(instance)
        instance.file.name = repair.file
        instance.file_size = len(xml_content)
        instance.created_by_id = repair.created_by_id
        instance.last_modified_by_id = repair.last_modified_by_id
        instance.get_and_save_json_of_xml(force=True, save=False, xml_content=xml_content)
        if instance.form.location_field:  # otherwise the location comes from POST /api/instances/
            instance.location = None
        instance.device = None
        try:
            instance.convert_location_from_field(save=False)
            instance.convert_device(save=False)
        except ValueError as error:
            logger.exception(error)
        instance.save()
        log_modification(old_instance, instance, source=REPAIR_SOURCE, user=user)
    return True


def upload_backup(repairs) -> str:
    """
    Zip of the instances as they are before the repair (django serialization, restorable with `loaddata`) and of the
    plan, saved in the instances' storage (S3 on the servers). Returns its storage key.
    """
    instances = Instance.objects.filter(id__in=[repair.instance_id for repair in repairs]).order_by("id")
    buffer = BytesIO()
    with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr("instances.json", serializers.serialize("json", instances, indent=2))
        zip_file.writestr("plan.json", json.dumps([asdict(repair) for repair in repairs], indent=2))
    storage = Instance._meta.get_field("file").storage
    return storage.save(f"{BACKUP_PREFIX}/backup_{timezone.now():%Y%m%d_%H%M%S}.zip", ContentFile(buffer.getvalue()))


class Command(BaseCommand):
    help = "Separate the submissions mixed up by /sync/form_upload/ when their xml file names collided"

    def add_arguments(self, parser):
        parser.add_argument("--form-id", type=int, default=None, help="Only this form (default: all forms)")
        parser.add_argument(
            "--created-from",
            type=datetime.fromisoformat,
            required=True,
            help="Creation date of the `_dup_` instances, e.g. 2026-10-01",
        )
        parser.add_argument("--created-to", type=datetime.fromisoformat, default=None, help="Default: now")
        parser.add_argument(
            "--instance-id", type=int, default=None, help="Only the group of this instance (original or `_dup_`)"
        )
        parser.add_argument("--limit", type=int, default=None, help="Only the first N groups")
        parser.add_argument("--apply", action="store_true", help="Save the changes (default: dry run)")
        parser.add_argument("--username", default=None, help="Author of the audit logs of the repairs")

    def handle(self, *args, **options):
        verbosity = options["verbosity"]
        user = User.objects.get(username=options["username"]) if options["username"] else None
        created_from = timezone.make_aware(options["created_from"])
        created_to = timezone.make_aware(options["created_to"]) if options["created_to"] else timezone.now()

        groups = find_collision_groups(created_from, created_to, options["form_id"])
        if options["instance_id"]:
            groups = [group for group in groups if options["instance_id"] in group[2]]
        if options["limit"]:
            groups = groups[: options["limit"]]
        repaired, skipped, unchanged = 0, 0, 0
        to_apply = []  # (repair, xml content)
        for form_id, original_file_name, instance_ids in groups:
            group = load_group(instance_ids)
            plan = plan_group_repair(group)
            label = f"form {form_id} {original_file_name} instances {instance_ids}"
            if plan.problems:
                skipped += 1
                self.stdout.write(f"SKIPPED {label}: {'; '.join(plan.problems)}")
                continue
            if not plan.repairs:
                unchanged += 1
                if verbosity > 1:
                    self.stdout.write(f"OK {label}")
                continue

            repaired += 1
            content_by_path = {xml["path"]: xml["content"] for xml in group["xmls"]}
            for repair in plan.repairs:
                if verbosity > 0:
                    self.stdout.write(
                        f"{'REPAIR' if options['apply'] else 'WOULD REPAIR'} instance {repair.instance_id} ({label}): "
                        f"file {repair.current_file} -> {repair.file}, "
                        f"created_by {repair.created_by_id}, last_modified_by {repair.last_modified_by_id}"
                    )
                to_apply.append((repair, content_by_path[repair.file].encode("utf-8")))

        if options["apply"] and to_apply:
            # before any change: if the upload fails, nothing is touched
            self.stdout.write(f"BACKUP {upload_backup([repair for repair, _xml_content in to_apply])}")
            for repair, xml_content in to_apply:
                if not apply_instance_repair(repair, xml_content, user):
                    self.stdout.write(f"CHANGED SINCE PLAN, not repaired: instance {repair.instance_id}")

        self.stdout.write(
            f"{len(groups)} groups: {repaired} {'repaired' if options['apply'] else 'to repair'}, "
            f"{unchanged} already fine, {skipped} skipped"
        )
