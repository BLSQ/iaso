from random import randint

from django.core.files.uploadedfile import UploadedFile
from django.core.management.base import BaseCommand
from django.db import transaction
from iaso.models import (
    User,
    Instance,
    OrgUnitType,
    Form,
    Project,
    FormVersion,
    Mapping,
    MappingVersion,
    DataSource,
    SourceVersion,
    ExternalCredentials,
    Account,
    Profile,
)
from django.core import management

from iaso.dhis2.aggregate_exporter import AggregateExporter
from iaso.dhis2.export_request_builder import ExportRequestBuilder
from django.utils.dateparse import parse_datetime
from dhis2 import Api
import json

"""
seed_test_data --mode=seed
seed_test_data --mode=stats
seed_test_data --mode=export
seed_test_data --mode=stats
seed_test_data --mode=export --force
 """


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
        dhis2_version = "2.30"
        mode = options.get("mode")

        account, account_created = Account.objects.get_or_create(
            name="Organisation Name" + dhis2_version
        )

        user, user_created = User.objects.get_or_create(
            username="testemail" + dhis2_version,
            email="testemail" + dhis2_version + "@bluesquarehub.com",
        )
        if user.password == "":
            user.set_password("testemail" + dhis2_version)
        user.save()
        try:
            user.iaso_profile
        except Profile.DoesNotExist:
            Profile.objects.create(account=account, user=user)
        self.user = user

        credentials, creds_created = ExternalCredentials.objects.get_or_create(
            name="Test export api",
            url="https://play.dhis2.org/" + dhis2_version,
            login="admin",
            password="district",
            account=account,
        )

        project = Project.objects.create(name="Test", account=account)
        datasource, _ds_created = DataSource.objects.get_or_create(
            name="reference_play_test" + dhis2_version, credentials=credentials
        )
        source_version, _created = SourceVersion.objects.get_or_create(
            number=1, data_source=datasource
        )

        orgunit_type, created = OrgUnitType.objects.get_or_create(
            name="FosaPlay", short_name="FosaPlay"
        )
        # quantity
        quantity_form, created = Form.objects.get_or_create(
            form_id="quantity_pca_" + dhis2_version,
            name="Quantity PCA form " + dhis2_version,
            period_type="MONTH",
            single_per_period=True,
        )
        project.forms.add(quantity_form)
        quantity_form.org_unit_types.add(orgunit_type)
        quantity_mapping_version = self.seed_form(
            quantity_form, datasource, credentials
        )

        # quality
        quality_form, created = Form.objects.get_or_create(
            form_id="quality_pca_" + dhis2_version,
            name="Quality PCA form " + dhis2_version,
            period_type="QUARTER",
            single_per_period=True,
        )
        quality_form.org_unit_types.add(orgunit_type)
        project.forms.add(quality_form)
        quality_form_version = self.seed_form(quality_form, datasource, credentials)
        project.save()

        self.quantity_form = quantity_form

        # cvs
        cvs_form, created = Form.objects.get_or_create(
            form_id="css_" + dhis2_version,
            name="Community Verification Satisfaction form " + dhis2_version,
            period_type="QUARTER",
            single_per_period=False,
        )
        cvs_form.org_unit_types.add(orgunit_type)

        cvs_mapping_version = self.seed_form(cvs_form, datasource, credentials,mapping_file="./testdata/seed-data-command-cvs-form-mapping.json")
        project.forms.add(cvs_form)

        
        self.project = project

        periods = ["201801", "201802", "201803", "201804", "201805", "201806"]
        quarter_periods = ["2018Q1", "2018Q2"]

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
            self.seed_instances(
                source_version,
                cvs_form,
                quarter_periods[0:1],
                cvs_mapping_version,
                fixed_instance_count=50,
            )
            print(
                "generated", cvs_form.name, cvs_form.instances.count(), "instances",
            )
            self.seed_instances(
                source_version, quantity_form, periods, quantity_mapping_version
            )
            print(
                "generated",
                quantity_form.name,
                quantity_form.instances.count(),
                "instances",
            )
            self.seed_instances(
                source_version, quality_form, quarter_periods, quality_form_version
            )
            print(
                "generated",
                quality_form.name,
                quality_form.instances.count(),
                "instances",
            )

        if mode == "export":
            force = options.get("force")
            print("********* exporting")
            print("fixing categoryOptions sharing")
            self.make_category_options_public(credentials)

            export_periods = quarter_periods[0:1] + periods[0:3]
            print("creating export request ", export_periods)
            export_request = ExportRequestBuilder().build_export_request(
                periods=export_periods,
                form_ids=[quantity_form.id, quality_form.id],
                orgunit_ids=[],
                launcher=self.user,
                force_export=force,
            )

            print("exporting", export_request.exportstatus_set.count())
            AggregateExporter().export_instances(export_request, True)

        if mode == "stats":
            for c in Instance.objects.with_status().counts_by_status():
                print(c)

    def make_category_options_public(self, credentials):
        api = Api(credentials.url, credentials.login, credentials.password)
        for page in api.get_paged(
            "categoryOptions", params={"fields": ":all"}, page_size=100
        ):
            for category_option in page["categoryOptions"]:
                if category_option["name"] != "default":
                    api.post(
                        "/sharing?type=categoryOption&id=" + category_option["id"],
                        {
                            "meta": {
                                "allowPublicAccess": True,
                                "allowExternalAccess": False,
                            },
                            "object": {
                                "id": category_option["id"],
                                "name": category_option["name"],
                                "displayName": category_option["displayName"],
                                "publicAccess": "rwrw----",
                                "user": category_option["user"],
                                "externalAccess": False,
                            },
                        },
                    )

    def seed_form(
        self,
        form,
        datasource,
        credentials,
        mapping_file="./testdata/seed-data-command-form-mapping.json",
    ):
        form_version, created = FormVersion.objects.get_or_create(
            form=form,
            version_id=1,
            file=UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload.xml")),
        )  # TODO: use better fixture
        mapping_type = "AGGREGATE" if form.single_per_period else "DERIVED"
        mapping_version_name = "aggregate" if form.single_per_period else "derived"

        mapping, _mapping_created = Mapping.objects.get_or_create(
            form=form, data_source=datasource, mapping_type=mapping_type
        )

        mapping_version_json = self.mapping_json(mapping_file)

        if (
            MappingVersion.objects.filter(
                name=mapping_version_name, form_version=form_version
            ).count()
            == 0
        ):
            MappingVersion.objects.get_or_create(
                name=mapping_version_name,
                form_version=form_version,
                mapping=mapping,
                json=mapping_version_json,
            )

        mapping_version, mapping_version_created = MappingVersion.objects.get_or_create(
            name=mapping_version_name, form_version=form_version, mapping=mapping
        )
        mapping_version.json = mapping_version_json
        mapping_version.save()
        return mapping_version

    @transaction.atomic
    def seed_instances(
        self, source_version, form, periods, mapping_version, fixed_instance_count=None
    ):
        for org_unit in source_version.orgunit_set.all():
            instances = []
            for period in periods:
                if fixed_instance_count and "Clinic" in org_unit.name:
                    instance_by_ou_periods = randint(1, fixed_instance_count)
                else:
                    instance_by_ou_periods = 2 if randint(1, 100) == 50 else 1
                #print("generating", form.name, org_unit.name, instance_by_ou_periods)
                for instance_count in range(0, instance_by_ou_periods):
                    instance = Instance(project=self.project)
                    instance.created_at = parse_datetime("2018-02-16T11:00:00+00")
                    instance.org_unit = org_unit
                    instance.period = period

                    test_data = {"_version": 1}

                    if  "question_mappings" in mapping_version.json:
                        # quality or quantity
                        for key in mapping_version.json["question_mappings"]:
                            test_data[key] = randint(1, 10)
                    else:
                        # CVS
                        for key in mapping_version.json["aggregations"]:
                            test_data[key["question_key"]] = randint(1, 100)

                    instance.json = test_data
                    instance.form = form
                    instance.file = UploadedFile(
                        open("iaso/tests/fixtures/hydroponics_test_upload.xml")
                    )
                    
                    instances.append(instance)
                    # force to past creation date
                    # looks the the first save don't take it
                    #instance.created_at = parse_datetime("2018-02-16T11:00:00+00")
                    #instance.save()
            
            Instance.objects.bulk_create(instances)

    def mapping_json(self, file):
        with open(file) as json_file:
            return json.load(json_file)
