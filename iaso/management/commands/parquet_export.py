import argparse

from django.core.management.base import BaseCommand

import iaso.models as m

from iaso.exports import parquet


class Command(BaseCommand):
    help = "Export instances to parquet"

    def add_arguments(self, parser):
        parser.formatter_class = argparse.RawTextHelpFormatter
        parser.add_argument("--form-id", type=int, required=False)
        parser.add_argument("--version-id", type=int, required=False)
        parser.add_argument(
            "--mode",
            choices=["pyramid", "submissions"],
            required=True,
            help="Choose export mode: pyramid or submission",
        )
        parser.epilog = """
        allow to export as parquet files
           - pyramid (for a given source version-id)
           - submissions (for a given form-id)

        exemple in dev environnement :
            docker compose run iaso manage parquet_export --mode pyramid --version-id 2
            duckdb -c 'describe "./media/pyramid.parquet"; select * from "./media/pyramid.parquet";'

            docker compose run iaso manage parquet_export --mode submissions --form-id 12
            duckdb -c 'describe "./media/submissions.parquet"; select * from "./media/submissions.parquet";'

            duckdb -c ' select  level_2_name, level_3_name, level_4_name, org_unit_name,  submission_org_unit_name from "./media/submissions.parquet"  left outer join "./media/pyramid.parquet" on "submission_org_unit_id"="org_unit_id";'
            duckdb -box -c 'DESCRIBE select * from "./media/submissions.parquet"  left outer join "./media/pyramid.parquet" on "submission_org_unit_id"="org_unit_id";'
"""

    def handle(self, *args, **options):
        mode = options["mode"]

        if mode == "pyramid":
            version_id = options["version_id"]
            parquet.export_django_query_to_parquet_via_duckdb(
                parquet.build_pyramid_queryset(m.OrgUnit.objects.filter(version_id=version_id), extra_fields=[":all"]),
                "./media/pyramid.parquet",
            )

        if mode == "submissions":
            form_id = options["form_id"]

            parquet.export_django_query_to_parquet_via_duckdb(
                parquet.build_submissions_queryset(m.Instance.objects, form_id), "./media/submissions.parquet"
            )
