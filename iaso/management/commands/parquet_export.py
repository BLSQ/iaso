from django.core.management.base import BaseCommand

import iaso.models as m

from iaso.exports import parquet


class Command(BaseCommand):
    help = "Export instances to parquet"

    def add_arguments(self, parser):
        parser.add_argument("--form-id", type=int, required=False)
        parser.add_argument("--version-id", type=int, required=False)
        parser.add_argument(
            "--mode",
            choices=["pyramid", "submissions"],
            required=True,
            help="Choose export mode: pyramid or submission",
        )

    def handle(self, *args, **options):
        mode = options["mode"]
        # docker compose run iaso manage parquet_export --mode pyramid --version-id 2
        if mode == "pyramid":
            version_id = options["version_id"]
            parquet.export_django_query_to_parquet_via_duckdb(
                parquet.build_orgunit_queryset(m.OrgUnit.objects.filter(version_id=version_id)),
                "./media/pyramid.parquet",
            )

        # docker compose run iaso manage parquet_export --mode submissions --form-id 12

        if mode == "submissions":
            form_id = options["form_id"]

            parquet.export_django_query_to_parquet_via_duckdb(
                parquet.build_submissions_queryset(m.Instance.objects, form_id), "./media/submissions.parquet"
            )
