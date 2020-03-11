from django.core.management.base import BaseCommand
from iaso.models import User, Instance, Form

from iaso.dhis2.aggregate_exporter import AggregateExporter
from iaso.dhis2.export_request_builder import ExportRequestBuilder


def boolean_input(question, default=None):
    result = input("%s " % question)
    if not result and default is not None:
        return default
    while len(result) < 1 or result[0].lower() not in "yn":
        result = input("Please answer yes or no: ")
    return result[0].lower() == "y"


def as_list(comma_list):
    results = []
    for fragment in comma_list.split(","):
        if fragment:
            results.append(fragment)
    return results


class Command(BaseCommand):
    help = "Export instances to dhis2 based on periods, form ids"

    def add_arguments(self, parser):
        parser.add_argument("--mode", type=str, help="seed or export", required=True)

        parser.add_argument(
            "--periods", type=str, help="periods to export", required=True
        )
        parser.add_argument(
            "--form_ids", type=str, help="form id to export", required=True
        )
        parser.add_argument("--user_id", type=str, help="user_id", required=True)
        parser.add_argument(
            "--orgunit_ids", type=str, help="form id to export", required=False
        )
        parser.add_argument(
            "-f",
            "--force",
            action="store_true",
            help="Force the re-export of exported submissions",
        )

    def handle(self, *args, **options):
        mode = options.get("mode")

        if mode == "export":

            force = options.get("force")

            user = User.objects.get(pk=options["user_id"])
            periods = as_list(options.get("periods"))
            form_ids = as_list(options.get("form_ids"))
            orgunit_ids = as_list(options.get("orgunit_ids", ""))

            forms = Form.objects.filter(id__in=form_ids)
            print("PARAMETERS : ")
            print("  periods", periods)
            print("  forms", form_ids, list(map(lambda x: x.name, forms)))
            print("  orgunit_ids", orgunit_ids)
            print("  user", user)

            print("********* exporting")
            export_request = ExportRequestBuilder().build_export_request(
                periods=periods,
                form_ids=form_ids,
                orgunit_ids=orgunit_ids,
                launcher=user,
                force_export=force,
            )
            print("will export", export_request.exportstatus_set.count(), "instances")
            queryset = Instance.objects.filter(
                id__in=export_request.exportstatus_set.values("instance_id")
            ).with_status()
            for c in queryset.filter(
                id__in=export_request.exportstatus_set.values("instance_id")
            ).counts_by_status():
                print(c)
            sure = boolean_input("Are you sure ? (y/n)")
            if sure:
                print("exporting")

                AggregateExporter().export_instances(export_request, True)

        elif mode == "stats":
            for c in Instance.objects.with_status().counts_by_status():
                print(c)
        else:
            print("supported mode stats vs export")
