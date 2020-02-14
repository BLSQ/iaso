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
                "de374662": {"id": "ksGURIlASZB", "valueType": "NUMBER"},
                "de374607": {"id": "VZPWjoT6Iyb", "valueType": "NUMBER"},
                "de374616": {"id": "YX1MQLgAD92", "valueType": "NUMBER"},
                "de374671": {"id": "lznF009R6XI", "valueType": "NUMBER"},
                "de374677": {"id": "LJBV91hapop", "valueType": "NUMBER"},
                "de374590": {"id": "FQhY9n5Ft7t", "valueType": "NUMBER"},
                "de374627": {"id": "YIDKw3om85t", "valueType": "NUMBER"},
                "de374617": {"id": "tZLjsE0VXrL", "valueType": "NUMBER"},
                "de374658": {"id": "zTWitarSrae", "valueType": "NUMBER"},
                "de374655": {"id": "DlZORv7kWSl", "valueType": "NUMBER"},
                "de374613": {"id": "xUNvvqqhNwz", "valueType": "NUMBER"},
                "de374642": {"id": "PNlOOplRNOp", "valueType": "NUMBER"},
                "de374612": {"id": "o44j6gPqFlA", "valueType": "NUMBER"},
                "de374669": {"id": "a7Pue4ht1n1", "valueType": "NUMBER"},
                "de374660": {"id": "mmHNj6THZNH", "valueType": "NUMBER"},
                "de374605": {"id": "ReljOufQV11", "valueType": "NUMBER"},
                "de475167": {"id": "jYYxzqd1dqM", "valueType": "NUMBER"},
                "de374646": {"id": "hUSSNufoUQz", "valueType": "NUMBER"},
                "de374620": {"id": "hoj1wTJT6ZW", "valueType": "NUMBER"},
                "de374622": {"id": "PxT44IblPCq", "valueType": "NUMBER"},
                "de374661": {"id": "dAnZOL5kxlK", "valueType": "NUMBER"},
                "de374599": {"id": "obbSEvaKTyW", "valueType": "NUMBER"},
                "de374640": {"id": "kxcIr99QcAO", "valueType": "NUMBER"},
                "de374664": {"id": "pSHgU0Wf4ir", "valueType": "NUMBER"},
                "de374593": {"id": "rFkRvm5Ns4a", "valueType": "NUMBER"},
                "de374683": {"id": "HmBwa7GWGRG", "valueType": "NUMBER"},
                "de374675": {"id": "iCGDtgPA28k", "valueType": "NUMBER"},
                "de374604": {"id": "yXZd6HTew4q", "valueType": "NUMBER"},
                "de374674": {"id": "tlSucW8wn23", "valueType": "NUMBER"},
                "de374628": {"id": "xrbIG3L9DdO", "valueType": "NUMBER"},
                "de374645": {"id": "yB3qDR4Mlqk", "valueType": "NUMBER"},
                "de374649": {"id": "aJ9oon0aJ87", "valueType": "NUMBER"},
                "de374633": {"id": "pVImQlMAla4", "valueType": "NUMBER"},
                "de374673": {"id": "oJLoUSMs3Ud", "valueType": "NUMBER"},
                "de374647": {"id": "PBXQFnb2AOk", "valueType": "NUMBER"},
                "de374611": {"id": "CUVDjGzRmmU", "valueType": "NUMBER"},
                "de374589": {"id": "Sdfo0RBu1W3", "valueType": "NUMBER"},
                "de374679": {"id": "Jw8BIUYVMGE", "valueType": "NUMBER"},
                "de374653": {"id": "AyLbN9fhY4W", "valueType": "NUMBER"},
                "de374621": {"id": "SLcj0Swq8rD", "valueType": "NUMBER"},
                "de374637": {"id": "C6yhZddXLCX", "valueType": "NUMBER"},
                "de374595": {"id": "FOWABOOZtPg", "valueType": "NUMBER"},
                "de475166": {"id": "supsI55QU7E", "valueType": "NUMBER"},
                "de374598": {"id": "D33rH8UHKlZ", "valueType": "NUMBER"},
                "de374602": {"id": "YknvQAH4LnL", "valueType": "NUMBER"},
                "de374603": {"id": "gyudBBtgGCv", "valueType": "NUMBER"},
                "de374608": {"id": "BI5CBuRJVSV", "valueType": "NUMBER"},
                "de374609": {"id": "e1eDe6JsE9j", "valueType": "NUMBER"},
                "de374594": {"id": "BVU4XA3aL0Y", "valueType": "NUMBER"},
                "de374592": {"id": "pgzNTiQwMES", "valueType": "NUMBER"},
                "de374600": {"id": "n91IylSb1JQ", "valueType": "NUMBER"},
                "de374657": {"id": "YgsAnqU3I7B", "valueType": "NUMBER"},
                "de374614": {"id": "x98jMXibptT", "valueType": "NUMBER"},
                "de374624": {"id": "tnDQ80ycQus", "valueType": "NUMBER"},
                "de374606": {"id": "iri7NSiuRc3", "valueType": "NUMBER"},
                "de374659": {"id": "un5mkYkVKqV", "valueType": "NUMBER"},
                "de374636": {"id": "V651s5yIbnR", "valueType": "NUMBER"},
                "de374629": {"id": "GgsWqA0YETj", "valueType": "NUMBER"},
                "de374634": {"id": "GNY9KvEmRjy", "valueType": "NUMBER"},
                "de374644": {"id": "YTmhoGBxE2m", "valueType": "NUMBER"},
                "de374681": {"id": "AzwEuYfWAtN", "valueType": "NUMBER"},
                "de374672": {"id": "y6noHe7ltxY", "valueType": "NUMBER"},
                "de475164": {"id": "nvsNqhfSSxd", "valueType": "NUMBER"},
                "de374631": {"id": "lmj0xtl5P6C", "valueType": "NUMBER"},
                "de374652": {"id": "vhT3YzTev3B", "valueType": "NUMBER"},
                "de374680": {"id": "q9CskFaFGE6", "valueType": "NUMBER"},
                "de374668": {"id": "ZGKUt190yEn", "valueType": "NUMBER"},
                "de374630": {"id": "uN64b5MivTO", "valueType": "NUMBER"},
                "de374619": {"id": "wIQ5ugpWYUH", "valueType": "NUMBER"},
                "de374670": {"id": "hI7NM78r3Rg", "valueType": "NUMBER"},
                "de374648": {"id": "ZgIaamZjBjz", "valueType": "NUMBER"},
                "de374643": {"id": "NV0OXpHu6x4", "valueType": "NUMBER"},
                "de374651": {"id": "EEEu3r8z1Rg", "valueType": "NUMBER"},
                "de374596": {"id": "oYZug9IEm3Q", "valueType": "NUMBER"},
                "de374663": {"id": "BtXmKYNBc3k", "valueType": "NUMBER"},
                "de374597": {"id": "KD5UjA5V16r", "valueType": "NUMBER"},
                "de374650": {"id": "eCIPNNYj9ZM", "valueType": "NUMBER"},
                "de374665": {"id": "jHxFwWMbXT2", "valueType": "NUMBER"},
                "de374615": {"id": "fDkcJaO15aQ", "valueType": "NUMBER"},
                "de374626": {"id": "pq4msirdtpr", "valueType": "NUMBER"},
                "de374601": {"id": "cQxY2T8GenX", "valueType": "NUMBER"},
                "de374638": {"id": "qUY0i7PnaLS", "valueType": "NUMBER"},
                "de374588": {"id": "ZecQS9lx4j9", "valueType": "NUMBER"},
                "de374632": {"id": "ozmEltb5V8d", "valueType": "NUMBER"},
                "de374591": {"id": "XVzfK55tu7h", "valueType": "NUMBER"},
                "de374676": {"id": "t6YgakIbFif", "valueType": "NUMBER"},
                "de374654": {"id": "E7QJ0voitk7", "valueType": "NUMBER"},
                "de374625": {"id": "w1554hhXNcq", "valueType": "NUMBER"},
                "de374656": {"id": "IJ4yZ027EmK", "valueType": "NUMBER"},
                "de374635": {"id": "D4PywWuIwy0", "valueType": "NUMBER"},
                "de374682": {"id": "Mow8dnhE6FJ", "valueType": "NUMBER"},
                "de374639": {"id": "a5MxE5H7d3q", "valueType": "NUMBER"},
                "de374641": {"id": "XMsORYe4ZcA", "valueType": "NUMBER"},
                "de374610": {"id": "FDpeT1lFQMM", "valueType": "NUMBER"},
                "de374667": {"id": "MeAvt39JtqN", "valueType": "NUMBER"},
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

            print("********* exporting")
            export_request = ExportRequestBuilder().build_export_request(
                periods, [self.form.id], [], self.user
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
