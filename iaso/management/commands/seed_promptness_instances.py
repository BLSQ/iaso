"""Generate submissions of a form to try the promptness stats API (`/api/promptness_stats/`) on a local pyramid.

For each period, each org unit expected to submit the form (see `get_target_org_units()`) gets a random scenario:
on time (during the period, during the grace period, on the deadline day), late (just after the deadline, long after,
or created on the device before the deadline but uploaded after), or missing (nothing, or only ignored submissions).
On top of that:
- a share of the parents of the targets (e.g. health areas) get no submission at all, for every period
- org units that are not expected to submit the form, or that are not VALID, get submissions that must be ignored
- submissions that would be uploaded in the future (current period) are not created: they are missing for now

Example:
    python manage.py seed_promptness_instances --form-id 307 --source-version-id 1 \
        --periods 202607 202608 202609 202610 --seed 42
"""

import random

from collections import Counter
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import uuid4

from django.contrib.auth.models import User
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from iaso.api.promptness_stats.period import PromptnessPeriod
from iaso.api.promptness_stats.queries import get_target_org_units
from iaso.models import Form, Instance, OrgUnit, Project, SourceVersion
from iaso.periods import detect


# Scenario of a target org unit for a period -> weight
SCENARIO_WEIGHTS = {
    "on_time": 40,  # uploaded during the period
    "on_time_grace_period": 10,  # uploaded after the end of the period, before the deadline
    "on_time_deadline_day": 3,  # uploaded on the deadline day, at 23:30
    "on_time_then_late": 3,  # an on time submission and a late one: the earliest one counts
    "late": 15,  # uploaded up to 30 days after the deadline
    "late_at_deadline_end": 2,  # uploaded at 00:00 on the day after the deadline
    "late_uploaded_after_deadline": 5,  # created on the device during the period, uploaded after the deadline
    "missing": 17,  # no submission
    "missing_ignored_only": 5,  # only a deleted submission and a submission without file
}
SCENARIO_STATUSES = {
    "on_time": "ON_TIME",
    "on_time_grace_period": "ON_TIME",
    "on_time_deadline_day": "ON_TIME",
    "on_time_then_late": "ON_TIME",
    "late": "LATE",
    "late_at_deadline_end": "LATE",
    "late_uploaded_after_deadline": "LATE",
    "missing": "MISSING",
    "missing_ignored_only": "MISSING",
}
# Share of the non-target org units with a submission (always ignored by the promptness stats)
IGNORED_ORG_UNITS_RATIO = 0.1


def random_datetime(start: datetime, end: datetime) -> datetime:
    """Random datetime in [start, end)"""
    return start + (end - start) * random.random()


def day_start(day) -> datetime:
    return timezone.make_aware(datetime.combine(day, datetime.min.time()))


class Command(BaseCommand):
    help = "Generate submissions of a form, on time, late or missing, to try the promptness stats API"

    def add_arguments(self, parser):
        parser.add_argument("--form-id", type=int, required=True)
        parser.add_argument("--source-version-id", type=int, required=True, help="Pyramid of the submissions")
        parser.add_argument("--periods", nargs="+", required=True, help="Periods of the form period type")
        parser.add_argument(
            "--usernames",
            nargs="+",
            help="Authors of the submissions, picked randomly (default: the users of the account of the form)",
        )
        parser.add_argument(
            "--silent-parents-ratio",
            type=float,
            default=0.1,
            help="Share of the parents of the targets (e.g. health areas) without any submission, for every period",
        )
        parser.add_argument("--seed", type=int, help="Random seed, to generate the same data again")
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete the existing submissions of the form for these periods in the pyramid first",
        )

    def handle(self, *args, **options):
        random.seed(options["seed"])

        form = Form.objects.get(id=options["form_id"])
        version = SourceVersion.objects.get(id=options["source_version_id"])
        project = self.get_project(form)
        users = self.get_users(project, options["usernames"])
        grace_period_days = form.promptness_grace_period_days
        if grace_period_days is None:
            raise CommandError(f"Form {form.id} has no grace period: set it in the form settings")
        for period_value in options["periods"]:
            if detect(period_value) != form.period_type:
                raise CommandError(f"Period {period_value} doesn't match the form period type {form.period_type}")

        with transaction.atomic():
            if options["clear"]:
                existing = Instance.objects.filter(form=form, period__in=options["periods"], org_unit__version=version)
                deleted_count, _ = existing.delete()
                self.stdout.write(f"Deleted {deleted_count} existing submissions and related objects")

            silent_parent_ids = self.pick_silent_parent_ids(form, version, options["silent_parents_ratio"])
            for period_value in options["periods"]:
                period = PromptnessPeriod.build(period_value, grace_period_days)
                self.seed_period(form, version, project, users, period, silent_parent_ids)

        self.print_not_applicable_org_units(form, version, options["periods"][0], grace_period_days)

    @staticmethod
    def get_project(form: Form) -> Project:
        project = form.projects.order_by("id").first()
        if project is None:
            raise CommandError(f"Form {form.id} is not in any project")
        return project

    @staticmethod
    def get_users(project: Project, usernames: Optional[List[str]]) -> List[User]:
        users = User.objects.filter(iaso_profile__account=project.account)
        if usernames:
            users = users.filter(username__in=usernames)
        users = list(users.order_by("id"))
        if not users:
            raise CommandError("No user found to create the submissions")
        return users

    @staticmethod
    def pick_silent_parent_ids(form: Form, version: SourceVersion, ratio: float) -> set:
        """Parents of the targets (e.g. health areas) whose targets never submit: their rows are at 0% for every
        period"""
        # The targets don't depend on the period, only their annotations do
        any_period = PromptnessPeriod.build("200001", 0)
        targets = get_target_org_units(form, any_period).filter(version=version)
        parent_ids = sorted(set(targets.exclude(parent=None).values_list("parent_id", flat=True)))
        return set(random.sample(parent_ids, int(len(parent_ids) * ratio)))

    def seed_period(self, form, version, project, users, period: PromptnessPeriod, silent_parent_ids: set):
        org_units = OrgUnit.objects.filter(version=version)
        targets = list(get_target_org_units(form, period).filter(version=version).order_by("id"))

        self.stdout.write(
            f"\nPeriod {period.value}: {period.start} -> {period.end}, deadline {period.deadline}, "
            f"{len(targets)} targets, {len(silent_parent_ids)} parents without submissions"
        )

        scenarios = Counter()
        statuses = Counter()
        skipped_in_future = 0
        now = timezone.now()
        for target in targets:
            if target.parent_id in silent_parent_ids:
                scenario = "missing"
            else:
                scenario = random.choices(list(SCENARIO_WEIGHTS), weights=list(SCENARIO_WEIGHTS.values()))[0]

            submissions = self.get_scenario_submissions(scenario, period)
            # Submissions can't be uploaded in the future: for a current period, they are missing for now
            if any(created_at > now for created_at, _, _ in submissions):
                submissions = []
                scenario = "missing"
                skipped_in_future += 1

            for created_at, source_created_at, kind in submissions:
                self.create_submission(form, project, target, period.value, users, created_at, source_created_at, kind)
            scenarios[scenario] += 1
            statuses[SCENARIO_STATUSES[scenario]] += 1

        ignored_count = self.seed_ignored_org_units(form, project, users, period, org_units, targets, now)

        self.stdout.write(f"  Statuses: {dict(statuses)}")
        self.stdout.write(f"  Scenarios: {dict(scenarios)}")
        self.stdout.write(f"  Not created because uploaded in the future (counted as missing): {skipped_in_future}")
        self.stdout.write(f"  Submissions of non-target or non-VALID org units (ignored): {ignored_count}")

    @staticmethod
    def get_scenario_submissions(scenario: str, period: PromptnessPeriod):
        """Submissions of a scenario: list of (created_at, source_created_at, kind), kind being "valid", "deleted" or
        "without_file". `created_at` is the upload date used by the promptness stats."""
        period_start = day_start(period.start)
        period_end = day_start(period.end + timedelta(days=1))
        deadline_end = period.deadline_end

        if scenario == "on_time":
            created_at = random_datetime(period_start, period_end)
            return [(created_at, created_at, "valid")]
        if scenario == "on_time_grace_period":
            created_at = random_datetime(period_end, deadline_end)
            return [(created_at, created_at, "valid")]
        if scenario == "on_time_deadline_day":
            created_at = deadline_end - timedelta(minutes=30)
            return [(created_at, created_at, "valid")]
        if scenario == "on_time_then_late":
            on_time = random_datetime(period_start, period_end)
            late = random_datetime(deadline_end, deadline_end + timedelta(days=30))
            return [(on_time, on_time, "valid"), (late, late, "valid")]
        if scenario == "late":
            created_at = random_datetime(deadline_end, deadline_end + timedelta(days=30))
            return [(created_at, created_at, "valid")]
        if scenario == "late_at_deadline_end":
            return [(deadline_end, deadline_end, "valid")]
        if scenario == "late_uploaded_after_deadline":
            created_at = random_datetime(deadline_end, deadline_end + timedelta(days=10))
            return [(created_at, random_datetime(period_start, period_end), "valid")]
        if scenario == "missing":
            return []
        if scenario == "missing_ignored_only":
            deleted = random_datetime(period_start, period_end)
            without_file = random_datetime(period_start, period_end)
            return [(deleted, deleted, "deleted"), (without_file, without_file, "without_file")]
        raise ValueError(f"Unknown scenario {scenario}")

    def seed_ignored_org_units(self, form, project, users, period, org_units, targets, now) -> int:
        """On time submissions of org units that are not targets (e.g. health areas) or not VALID: always ignored"""
        target_ids = {target.id for target in targets}
        candidates = [org_unit for org_unit in org_units.order_by("id") if org_unit.id not in target_ids]
        non_valid = [org_unit for org_unit in candidates if org_unit.validation_status != OrgUnit.VALIDATION_VALID]
        valid_sample = random.sample(
            [org_unit for org_unit in candidates if org_unit.validation_status == OrgUnit.VALIDATION_VALID],
            int(len(candidates) * IGNORED_ORG_UNITS_RATIO),
        )
        created_count = 0
        for org_unit in non_valid + valid_sample:
            created_at = random_datetime(day_start(period.start), day_start(period.end + timedelta(days=1)))
            if created_at > now:
                continue
            self.create_submission(form, project, org_unit, period.value, users, created_at, created_at, "valid")
            created_count += 1
        return created_count

    @staticmethod
    def create_submission(form, project, org_unit, period_value, users, created_at, source_created_at, kind):
        uuid = str(uuid4())
        instance = Instance(
            form=form,
            project=project,
            org_unit=org_unit,
            period=period_value,
            name=form.name,
            uuid=uuid,
            file_name=f"{uuid}.xml",
            created_by=random.choice(users),
            source_created_at=source_created_at,
            source_updated_at=source_created_at,
            json={"instanceID": f"uuid:{uuid}", "period": period_value},
            deleted=kind == "deleted",
        )
        if kind != "without_file":
            xml = (
                f'<?xml version="1.0"?><data id="{form.form_id}">'
                f"<period>{period_value}</period><meta><instanceID>uuid:{uuid}</instanceID></meta></data>"
            )
            instance.file.save(f"{uuid}.xml", ContentFile(xml.encode()), save=False)
        instance.save()
        # `created_at` is `auto_now_add`: set it with an update
        Instance.objects.filter(pk=instance.pk).update(created_at=created_at)

    def print_not_applicable_org_units(self, form, version, period_value, grace_period_days):
        """VALID org units with no target in their hierarchy (itself included): their rows are not applicable"""
        period = PromptnessPeriod.build(period_value, grace_period_days)
        targets = get_target_org_units(form, period).filter(version=version)
        target_paths = [str(path) for path in targets.values_list("path", flat=True)]
        valid_org_units = OrgUnit.objects.filter(version=version, validation_status=OrgUnit.VALIDATION_VALID)
        not_applicable = [
            org_unit
            for org_unit in valid_org_units.select_related("org_unit_type").order_by("path")
            if not any(path == str(org_unit.path) or path.startswith(f"{org_unit.path}.") for path in target_paths)
        ]
        self.stdout.write(f"\nNot applicable org units (nothing expected in their hierarchy): {len(not_applicable)}")
        for org_unit in not_applicable:
            org_unit_type_name = org_unit.org_unit_type.name if org_unit.org_unit_type else "-"
            self.stdout.write(f"  {org_unit.id} {org_unit.name} ({org_unit_type_name})")
