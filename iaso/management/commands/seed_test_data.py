from datetime import datetime, date
from random import random, randint
from django.core.management.base import BaseCommand
from django.db import transaction
from iaso.models import (
    User,
    Instance,
    OrgUnit,
    Form,
    FormVersion,
    Mapping,
    MappingVersion,
    DataSource,
    SourceVersion,
    ExternalCredentials,
    Account,
    ExportLog,
    ExportRequest,
    ExportStatus,
)
from django.core import management

from iaso.dhis2.aggregate_exporter import (
    handle_exception,
    map_to_aggregate,
    AggregateExporter,
    InstanceExportError,
)
from iaso.dhis2.export_request_builder import ExportRequestBuilder
from iaso.dhis2.status_queries import counts_by_status


class Command(BaseCommand):
    def add_arguments(self, parser):
        parser.add_argument("--mode", type=str, help="seed or export", required=True)

        parser.add_argument(
            "-f",
            "--force",
            action="store_true",
            help="Force the re-export of exported submissions",
        )

    def handle(self, *args, **options):
        dhis2_version = "2.29"
        mode = options.get("mode")
        form, created = Form.objects.get_or_create(
            form_id="quality_pca_" + dhis2_version,
            name="Quality PCA form " + dhis2_version,
            period_type="month",
            single_per_period=True,
        )
        self.form = form
        form_version, created = FormVersion.objects.get_or_create(
            form=form, version_id=1
        )

        self.form = form
        self.form_version = form_version

        account, account_created = Account.objects.get_or_create(
            name="Organisation Name" + dhis2_version
        )

        user, user_created = User.objects.get_or_create(
            username="Test User Name" + dhis2_version,
            email="testemail" + dhis2_version + "@bluesquarehub.com",
        )
        self.user = user

        credentials, creds_created = ExternalCredentials.objects.get_or_create(
            name="Test export api",
            url="https://play.dhis2.org/" + dhis2_version,
            login="admin",
            password="district",
            account=account,
        )

        datasource, _ds_created = DataSource.objects.get_or_create(
            name="reference_play_test" + dhis2_version, credentials=credentials
        )
        source_version, _created = SourceVersion.objects.get_or_create(
            number=1, data_source=datasource
        )

        mapping, _mapping_created = Mapping.objects.get_or_create(
            form=form, data_source=datasource, mapping_type="AGGREGATE"
        )
        self.mapping = mapping

        mapping_version_json = {
            "data_set_name": "ART monthly summary",
            "data_set_id": "lyLU2wR22tC",
            "question_mappings": {
                "de374662": {"id": "ksGURIlASZB", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0", "categoryOptionCombo": "HllvX50cXC0"},
                "de374607": {"id": "VZPWjoT6Iyb", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0", "categoryOptionCombo": "HllvX50cXC0"},
                "de374616": {"id": "YX1MQLgAD92", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0", "categoryOptionCombo": "HllvX50cXC0"},
                "de374671": {"id": "lznF009R6XI", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0", "categoryOptionCombo": "HllvX50cXC0"},
                "de374677": {"id": "LJBV91hapop", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0", "categoryOptionCombo": "HllvX50cXC0"},
                "de374590": {"id": "FQhY9n5Ft7t", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0", "categoryOptionCombo": "HllvX50cXC0"},
                "de374627": {"id": "YIDKw3om85t", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374617": {"id": "tZLjsE0VXrL", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0", "categoryOptionCombo": "HllvX50cXC0"},
                "de374658": {"id": "zTWitarSrae", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374655": {"id": "DlZORv7kWSl", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0", "categoryOptionCombo": "HllvX50cXC0"},
                "de374613": {"id": "xUNvvqqhNwz", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374642": {"id": "PNlOOplRNOp", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374612": {"id": "o44j6gPqFlA", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374669": {"id": "a7Pue4ht1n1", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374660": {"id": "mmHNj6THZNH", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374605": {"id": "ReljOufQV11", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de475167": {"id": "jYYxzqd1dqM", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374646": {"id": "hUSSNufoUQz", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374620": {"id": "hoj1wTJT6ZW", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374622": {"id": "PxT44IblPCq", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374661": {"id": "dAnZOL5kxlK", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374599": {"id": "obbSEvaKTyW", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374640": {"id": "kxcIr99QcAO", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374664": {"id": "pSHgU0Wf4ir", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374593": {"id": "rFkRvm5Ns4a", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374683": {"id": "HmBwa7GWGRG", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0", "categoryOptionCombo": "HllvX50cXC0"},
                "de374675": {"id": "iCGDtgPA28k", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374604": {"id": "yXZd6HTew4q", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374674": {"id": "tlSucW8wn23", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374628": {"id": "xrbIG3L9DdO", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374645": {"id": "yB3qDR4Mlqk", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374649": {"id": "aJ9oon0aJ87", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374633": {"id": "pVImQlMAla4", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374673": {"id": "oJLoUSMs3Ud", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374647": {"id": "PBXQFnb2AOk", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374611": {"id": "CUVDjGzRmmU", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374589": {"id": "Sdfo0RBu1W3", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374679": {"id": "Jw8BIUYVMGE", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374653": {"id": "AyLbN9fhY4W", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374621": {"id": "SLcj0Swq8rD", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374637": {"id": "C6yhZddXLCX", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374595": {"id": "FOWABOOZtPg", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de475166": {"id": "supsI55QU7E", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374598": {"id": "D33rH8UHKlZ", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374602": {"id": "YknvQAH4LnL", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374603": {"id": "gyudBBtgGCv", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374608": {"id": "BI5CBuRJVSV", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374609": {"id": "e1eDe6JsE9j", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374594": {"id": "BVU4XA3aL0Y", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374592": {"id": "pgzNTiQwMES", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374600": {"id": "n91IylSb1JQ", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374657": {"id": "YgsAnqU3I7B", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374614": {"id": "x98jMXibptT", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374624": {"id": "tnDQ80ycQus", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374606": {"id": "iri7NSiuRc3", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374659": {"id": "un5mkYkVKqV", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374636": {"id": "V651s5yIbnR", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374629": {"id": "GgsWqA0YETj", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374634": {"id": "GNY9KvEmRjy", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374644": {"id": "YTmhoGBxE2m", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374681": {"id": "AzwEuYfWAtN", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374672": {"id": "y6noHe7ltxY", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de475164": {"id": "nvsNqhfSSxd", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374631": {"id": "lmj0xtl5P6C", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374652": {"id": "vhT3YzTev3B", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374680": {"id": "q9CskFaFGE6", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374668": {"id": "ZGKUt190yEn", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374630": {"id": "uN64b5MivTO", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374619": {"id": "wIQ5ugpWYUH", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374670": {"id": "hI7NM78r3Rg", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374648": {"id": "ZgIaamZjBjz", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374643": {"id": "NV0OXpHu6x4", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374651": {"id": "EEEu3r8z1Rg", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374596": {"id": "oYZug9IEm3Q", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374663": {"id": "BtXmKYNBc3k", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374597": {"id": "KD5UjA5V16r", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374650": {"id": "eCIPNNYj9ZM", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374665": {"id": "jHxFwWMbXT2", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374615": {"id": "fDkcJaO15aQ", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374626": {"id": "pq4msirdtpr", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374601": {"id": "cQxY2T8GenX", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374638": {"id": "qUY0i7PnaLS", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374588": {"id": "ZecQS9lx4j9", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374632": {"id": "ozmEltb5V8d", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374591": {"id": "XVzfK55tu7h", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374676": {"id": "t6YgakIbFif", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374654": {"id": "E7QJ0voitk7", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374625": {"id": "w1554hhXNcq", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374656": {"id": "IJ4yZ027EmK", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374635": {"id": "D4PywWuIwy0", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374682": {"id": "Mow8dnhE6FJ", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374639": {"id": "a5MxE5H7d3q", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374641": {"id": "XMsORYe4ZcA", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374610": {"id": "FDpeT1lFQMM", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
                "de374667": {"id": "MeAvt39JtqN", "valueType": "NUMBER", "attributeOptionCombo": "HllvX50cXC0",  "categoryOptionCombo": "HllvX50cXC0"},
            },
        }

        if (
            MappingVersion.objects.filter(
                name="aggregate", form_version=self.form_version
            ).count()
            == 0
        ):
            MappingVersion.objects.get_or_create(
                name="aggregate",
                form_version=self.form_version,
                mapping=self.mapping,
                json=mapping_version_json,
            )

        mapping_version, mapping_version_created = MappingVersion.objects.get_or_create(
            name="aggregate", form_version=self.form_version, mapping=self.mapping
        )
        mapping_version.json = mapping_version_json
        mapping_version.save()
        periods = ["201801", "201802", "201803"]

        print("********* FORM seed done")
        if mode == "seed":
            print("******** delete previous instances")
            print(
                Instance.objects.filter(
                    org_unit__in=source_version.orgunit_set.all()
                ).delete()
            )

            print("********* Importing orgunits")

            management.call_command(
                "dhis2_ou_importer",
                dhis2_url=credentials.url,
                dhis2_user=credentials.login,
                dhis2_password=credentials.password,
                source_name=datasource.name,
                version_number=source_version.number,
                org_unit_type_csv_file="./iaso/tests/fixtures/empty_unit_types.csv",
                force=True,
            )

            print("********* generating instances")
            self.seed_instances(source_version, form, periods, mapping_version)
            print("generated", form.instance_set.count(), "instances")

        if mode == "export":

            force = options.get("force")

            print("********* exporting")
            export_request = ExportRequestBuilder().build_export_request(
                periods=periods,
                form_ids=[self.form.id],
                orgunit_ids=[],
                launcher=self.user,
                force_export=force,
            )

            print("exporting")
            AggregateExporter().export_instances(export_request, True)

        if mode == "stats":
            for c in counts_by_status():
                print(c)

    @transaction.atomic
    def seed_instances(self, source_version, form, periods, mapping_version):
        for org_unit in source_version.orgunit_set.all():
            for period in periods:
                instance_by_ou_periods = 2 if randint(1, 100) == 50 else 1
                for instance_count in range(0, instance_by_ou_periods):
                    instance = Instance()
                    instance.created_at = datetime.strptime(
                        "2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p"
                    )
                    instance.org_unit = org_unit
                    instance.period = period

                    test_data = {}

                    for key in mapping_version.json["question_mappings"]:
                        test_data[key] = randint(1, 10)

                    instance.json = test_data
                    instance.form = self.form
                    instance.save()
                    # force to past creation date
                    # looks the the first save don't take it
                    instance.created_at = datetime.strptime(
                        "2018-02-16 11:00 AM", "%Y-%m-%d %I:%M %p"
                    )
                    instance.save()
