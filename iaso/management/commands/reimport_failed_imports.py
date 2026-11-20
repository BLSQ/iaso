from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from hat.api_import.models import APIImport
from iaso.api.instances.views import import_data as import_instances
from iaso.api.org_units.utils import import_org_units
from iaso.models import Project
from iaso.tasks.process_mobile_bulk_upload import process_mobile_bulk_upload


SUPPORTED_IMPORT_TYPES = ("orgUnit", "instance", "bulk")


class DryRunRollback(Exception):
    pass


class Command(BaseCommand):
    help = (
        "Replay failed imports (APIImport with has_problem): org units and instances each in their own transaction, "
        "bulk uploads by launching their task again"
    )

    def add_arguments(self, parser):
        parser.add_argument("--ids", type=int, nargs="+", help="APIImport ids to replay")
        parser.add_argument("--all", action="store_true", help="Replay all the failed imports")
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Run the org unit and instance imports, then roll them back; don't launch the bulk upload tasks",
        )

    def handle(self, *args, **options):
        if not options["ids"] and not options["all"]:
            raise CommandError("Give the APIImport ids to replay (--ids), or --all")
        dry_run = options["dry_run"]

        failed_imports = APIImport.objects.filter(has_problem=True, import_type__in=SUPPORTED_IMPORT_TYPES)
        if options["ids"]:
            failed_imports = failed_imports.filter(id__in=options["ids"])

        # Not replayed for now: they would fail again (no project for an anonymous user), and replaying them as
        # someone else is a decision about who the data is attributed to
        anonymous_ids = list(failed_imports.filter(user__isnull=True).order_by("id").values_list("id", flat=True))
        if anonymous_ids:
            self.stderr.write(f"Skipped {len(anonymous_ids)} imports without user: {anonymous_ids}")

        replayed = launched = failed = 0
        for api_import in failed_imports.filter(user__isnull=False).select_related("user").order_by("id"):
            label = f"APIImport {api_import.id} ({api_import.import_type})"
            try:
                if api_import.import_type == "bulk":
                    self.launch_bulk_upload(api_import, dry_run)
                else:
                    self.replay(api_import, dry_run)
            except Exception as e:
                failed += 1
                self.stderr.write(f"{label} failed: {e!r}")
                continue
            if api_import.import_type == "bulk":
                launched += 1
            else:
                replayed += 1
            if options["verbosity"] >= 2:
                self.stdout.write(f"{label} {'launched' if api_import.import_type == 'bulk' else 'replayed'}")

        if dry_run:
            self.stdout.write(f"Replayed: {replayed}, failed: {failed} (dry run, rolled back), to launch: {launched}")
        else:
            self.stdout.write(f"Replayed: {replayed}, failed: {failed}, launched: {launched}")

    def replay(self, api_import: APIImport, dry_run: bool) -> None:
        try:
            with transaction.atomic():
                if api_import.import_type == "orgUnit":
                    # Parents first, as the mobile endpoint does
                    org_units = sorted(
                        api_import.json_body, key=lambda org_unit: float(org_unit.get("created_at") or 0)
                    )
                    import_org_units(org_units, api_import.user, api_import.app_id)
                else:
                    import_instances(api_import.json_body, api_import.user, api_import.app_id, api_import=api_import)
                api_import.has_problem = False
                api_import.save()
                if dry_run:
                    raise DryRunRollback
        except DryRunRollback:
            api_import.refresh_from_db()

    def launch_bulk_upload(self, api_import: APIImport, dry_run: bool) -> None:
        """The task resets `has_problem` once it succeeds"""
        project = Project.objects.get(app_id=api_import.app_id)
        if not dry_run:
            process_mobile_bulk_upload(api_import_id=api_import.id, project_id=project.id, user=api_import.user)
