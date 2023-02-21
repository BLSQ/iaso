from time import perf_counter

from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from iaso.models import OrgUnit


class Command(BaseCommand):
    help = "Set `path` field on org unit, starting at the top of the hierarchy."
    max_seed_level = 3

    def add_arguments(self, parser):  # TODO: remove me
        parser.add_argument(
            "--test-seed", action="store_true", default=False, help="Create a bunch of org units for load testing"
        )

    def handle(self, *args, **options):
        if options["test_seed"]:
            if not settings.DEBUG:
                raise CommandError("Cannot use test-seed in non-debug mode")
            self._test_seed()

        start = perf_counter()

        self.stdout.write("Setting path on org units...")

        no_path_count_before = OrgUnit.objects.filter(path=None).count()
        self.stdout.write(f"Found {no_path_count_before} without path")

        root_org_units = OrgUnit.objects.filter(parent=None, path=None)
        self.stdout.write(f"Found {len(root_org_units)} root org units without path")

        for org_unit in root_org_units:
            self.stdout.write(f"Setting path for root org unit {org_unit.name} and children...")
            with transaction.atomic():
                org_unit.save(update_fields=["path"])
            self.stdout.write("Done")

        # Cheating - simulating an org unit created during the migration
        # TODO: remove me
        if options["test_seed"]:
            no_path = OrgUnit(parent=OrgUnit.objects.first(), name="set_org_units_path test")
            no_path.save(skip_calculate_path=True)

        no_path_count_after = OrgUnit.objects.filter(path=None).count()
        if no_path_count_after == 0:
            self.stdout.write(f"After this operation, all org units have a path")
        else:
            self.stdout.write(f"After this operation, {no_path_count_after} org units are left without path")
            self.stdout.write("Attempting fix")

            for org_unit in OrgUnit.objects.filter(path=None):
                org_unit.save(update_fields=["path"])

            no_path_count_final = OrgUnit.objects.filter(path=None).count()
            if no_path_count_final == 0:
                self.stdout.write(f"After this fix, all org units have a path")
            else:
                self.stdout.write(f"After fix attempt, still {no_path_count_final} org units are left without path")
                self.stdout.write("Should be fixed manually")

        stop = perf_counter()

        self.stdout.write(f"Elapsed time: {stop - start} seconds.")

    def _test_seed(self):  # TODO: remove me
        OrgUnit.objects.filter(name="set_org_units_path test").delete()
        self.stdout.write("Creating test org units...")

        with transaction.atomic():
            created = self._create_org_unit_batch(0)

        self.stdout.write(f"Created {created} test org units!")

    def _create_org_unit_batch(self, level, parent=None):  # TODO: remove me
        created = 0

        for _ in range(10):
            new_parent = OrgUnit(parent=parent, name="set_org_units_path test")
            new_parent.save(skip_calculate_path=True)
            created += 1
            if level < self.max_seed_level:
                created += self._create_org_unit_batch(level + 1, new_parent)

        return created
