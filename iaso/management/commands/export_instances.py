from django.core.management.base import BaseCommand

from django.core import management

from iaso.dhis2.datavalue_exporter import DataValueExporter
from iaso.dhis2.export_request_builder import ExportRequestBuilder, NothingToExportError

import iaso.models as m
from django.utils import timezone


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("--user", type=str, help="username", required=True)
        parser.add_argument(
            "--formids",
            type=str,
            help="db id comma seperated of the forms",
            required=True,
        )

    def dump_alive(self):
        print("*********************** ALIVE ?")
        for alive in m.ExportRequest.objects.filter(status__in=m.ALIVE_STATUSES):
            print(alive.id, alive.status, alive.params)
        print("***********************")

    def handle(self, *args, **options):

        self.dump_alive()

        user = m.User.objects.filter(username=options["user"]).first()

        form_ids = [
            str(f.id)
            for f in m.Form.objects.filter(
                projects__account=user.iaso_profile.account
            ).filter(form_id=options["formids"])
        ]

        try:
            self.log(
                "Prepare export of instances to dhis2",
                options["formids"],
                f"({form_ids})",
                "on behalf of",
                user,
            )

            export_request = ExportRequestBuilder().build_export_request(
                filters={"form_ids": ",".join(form_ids)}, launcher=user
            )

            print(
                "export_request => ",
                export_request.id,
                export_request.status,
                export_request.params,
            )

            self.dump_alive()

            import pdb

            pdb.set_trace()

            self.log(
                "Exporting",
                export_request.exportstatus_set.count(),
                "instances",
                timezone.now(),
            )
            DataValueExporter().export_instances(export_request, True)
            self.log(
                "Exported",
                export_request.exportstatus_set.count(),
                "instances",
                timezone.now(),
            )
        except NothingToExportError as error:
            self.log("nothing to export : ", error)

    def log(self, *args):
        print("ExportInstancesCommand", timezone.now(), ":", *args)
