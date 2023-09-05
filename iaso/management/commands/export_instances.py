from django.core.management.base import BaseCommand
from django.utils import timezone

import iaso.models as m
from iaso.dhis2.datavalue_exporter import DataValueExporter
from iaso.dhis2.export_request_builder import ExportRequestBuilder, NothingToExportError


# ./manage.py export_instances --user "testemail2.33.4" --formids "event_tracker2.33.4"
#
# can normaly be scheduled as cron and is supposed to handle gracefully re-entrance
# don't know how robust the re-entrance is
#
class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("--user", type=str, help="username", required=True)
        parser.add_argument("--page_size", type=int, help="page_size")
        parser.add_argument("--continue_on_error", action="store_true", help="continue on error")
        parser.add_argument("--formids", type=str, help="db id comma seperated of the forms", required=True)

    def handle(self, *args, **options):
        continue_on_error = options.get("continue_on_error")
        user = m.User.objects.filter(username=options["user"]).first()

        form_ids = [
            str(f.id)
            for f in m.Form.objects.filter(projects__account=user.iaso_profile.account).filter(
                form_id=options["formids"]
            )
        ]
        page_size = options.get("page_size", 25)
        try:
            self.log("Prepare export of instances to dhis2", options["formids"], f"({form_ids})", "on behalf of", user)
            export_request = ExportRequestBuilder().build_export_request(
                filters={"form_ids": ",".join(form_ids)}, launcher=user
            )

            print("export_request => ", export_request.id, export_request.status, export_request.params)

            self.log("Exporting", export_request.exportstatus_set.count(), "instances", timezone.now())
            DataValueExporter().export_instances(
                export_request, page_size=page_size, continue_on_error=continue_on_error
            )
            self.log("Exported", export_request.exportstatus_set.count(), "instances", timezone.now())
        except NothingToExportError as error:
            self.log("nothing to export : ", error)

    def log(self, *args):
        print("ExportInstancesCommand", timezone.now(), ":", *args)
