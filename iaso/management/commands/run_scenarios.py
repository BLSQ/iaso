"""Runs an account's scenarios, for CI or a pipeline: a summary (verbosity 1), each failure (2), or the markdown report
(`--report`). Read-only: the scenarios' last result isn't updated. Exits with an error when a scenario doesn't pass.

    docker compose run --rm iaso manage run_scenarios --account 1 --workflow-version 12
"""

from django.core.management.base import BaseCommand, CommandError

from iaso.models import Account, Scenario, ScenarioStatus, WorkflowVersion
from iaso.scenarios.report import markdown_report
from iaso.scenarios.runs import run_scenarios


class Command(BaseCommand):
    help = "Runs the scenarios of an account (read-only) and exits with an error when one doesn't pass"

    def add_arguments(self, parser):
        parser.add_argument("--account", type=int, required=True, help="Account id")
        parser.add_argument(
            "--workflow-version",
            type=int,
            help="Run the entity scenarios of its entity type against this version, instead of the published one",
        )
        parser.add_argument("--report", help="Write the markdown report to this file")

    def handle(self, *args, **options):
        account = Account.objects.filter(id=options["account"]).first()
        if account is None:
            raise CommandError(f"No account {options['account']}")
        scenarios = Scenario.objects.filter(account=account).select_related("account", "entity_type").order_by("id")
        workflow_version = None
        if options["workflow_version"]:
            workflow_version = (
                WorkflowVersion.objects.filter(id=options["workflow_version"], workflow__entity_type__account=account)
                .select_related("workflow")
                .first()
            )
            if workflow_version is None:
                raise CommandError(f"No workflow version {options['workflow_version']} in this account")
            scenarios = scenarios.filter(entity_type=workflow_version.workflow.entity_type)

        outcomes = run_scenarios(list(scenarios), workflow_version)

        verbosity = options["verbosity"]
        for outcome in outcomes:
            if verbosity >= 1:
                self.stdout.write(f"{outcome.status:<7} {outcome.scenario.name} (#{outcome.scenario.id})")
            if verbosity >= 2:
                for failure in outcome.failures:
                    self.stdout.write(f"        {failure}")
        if options["report"]:
            with open(options["report"], "w") as report_file:
                report_file.write(markdown_report([outcome.result for outcome in outcomes if outcome.result]))

        not_passed = [outcome for outcome in outcomes if outcome.status != ScenarioStatus.PASSED]
        if verbosity >= 1:
            self.stdout.write(f"{len(outcomes)} scenarios, {len(outcomes) - len(not_passed)} passed")
        if not_passed:
            raise CommandError(f"{len(not_passed)} scenario(s) didn't pass")
