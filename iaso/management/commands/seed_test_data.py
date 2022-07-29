import pdb
from random import randint, random
from lxml import etree
from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.utils import timezone
from django.contrib.gis.geos import Point
from django.core.files.uploadedfile import UploadedFile
from django.core.management.base import BaseCommand
from django.db import transaction
from uuid import uuid4
from django.contrib.auth.models import Permission
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

from iaso.dhis2.datavalue_exporter import DataValueExporter
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
        parser.add_argument("--dhis2version", type=str, help="seed or export", required=True, default="2.31.8")
        parser.add_argument("-f", "--force", action="store_true", help="Force the re-export of exported submissions")

    def handle(self, *args, **options):
        dhis2_version = options.get("dhis2version")
        mode = options.get("mode")

        account, account_created = Account.objects.get_or_create(name="Organisation Name" + dhis2_version)

        user, user_created = User.objects.get_or_create(
            username="testemail" + dhis2_version, email="testemail" + dhis2_version + "@bluesquarehub.com"
        )
        if user.password == "":
            user.set_password("testemail" + dhis2_version)
        user.user_permissions.clear()
        for permission in Permission.objects.all():
            user.user_permissions.add(permission)
        user.save()
        try:
            user.iaso_profile
        except Profile.DoesNotExist:
            iaso_profile = Profile.objects.create(account=account, user=user)
            user.iaso_profile = iaso_profile
        self.user = user

        # make it a superuser to have access to django admin
        from django.contrib.auth import get_user_model

        UserAdmin = get_user_model()
        adminuser = UserAdmin.objects.get(username=user.username)
        adminuser.is_staff = True
        adminuser.is_admin = True
        adminuser.is_superuser = True
        adminuser.save()

        credentials, creds_created = ExternalCredentials.objects.get_or_create(
            name="Test export api",
            url="https://play.dhis2.org/" + dhis2_version,
            login="admin",
            password="district",
            account=account,
        )

        project, p_created = Project.objects.get_or_create(name="Test" + dhis2_version, account=account)

        project.app_id="org.bluesquare.play"
        project.save()

        datasource, _ds_created = DataSource.objects.get_or_create(
            name="reference_play_test" + dhis2_version, credentials=credentials
        )
        datasource.projects.add(project)

        source_version, _created = SourceVersion.objects.get_or_create(number=1, data_source=datasource)
        
        datasource.default_version = source_version
        datasource.save()

        account.default_version = source_version
        account.save()

        orgunit_type, created = OrgUnitType.objects.get_or_create(name="FosaPlay", short_name="FosaPlay")
        orgunit_type.projects.add(project)
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
            quantity_form,
            datasource,
            credentials,
            mapping_type="AGGREGATE",
            mapping_file="./testdata/seed-data-command-form-mapping.json",
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
        quality_form_version = self.seed_form(
            quality_form,
            datasource,
            credentials,
            mapping_type="AGGREGATE",
            mapping_file="./testdata/seed-data-command-form-mapping.json",
            xls_file="testdata/seed-data-command-form-i18n.xlsx",
        )
        project.save()

        self.quantity_form = quantity_form

        # cvs
        cvs_form, created = Form.objects.get_or_create(
            form_id="cvs_" + dhis2_version,
            name="Community Verification Satisfaction form " + dhis2_version,
            period_type="QUARTER",
            single_per_period=False,
        )
        cvs_form.org_unit_types.add(orgunit_type)

        cvs_mapping_version = self.seed_form(
            cvs_form,
            datasource,
            credentials,
            mapping_type="EVENT",
            mapping_file="./testdata/seed-data-command-cvs_survey-mapping.json",
            xls_file="./testdata/seed-data-command-cvs_survey.xls",
        )
        project.forms.add(cvs_form)

        cvs_stat_form, created = Form.objects.get_or_create(
            form_id="cvs_stat_" + dhis2_version,
            name="CVS Stats " + dhis2_version,
            period_type="QUARTER",
            single_per_period=False,
        )
        cvs_stat_form.derived = True
        cvs_stat_form.save()

        cvs_stat_form.org_unit_types.add(orgunit_type)

        cvs_stat_mapping_version = self.seed_form(
            cvs_stat_form,
            datasource,
            credentials,
            mapping_type="DERIVED",
            mapping_file="./testdata/seed-data-command-cvs-form-mapping.json",
            xls_file="./testdata/seed-data-command-form-cvs-stats.xls",
        )

        project.forms.add(cvs_stat_form)

        event_tracker_form, created = Form.objects.get_or_create(
            form_id="event_tracker" + dhis2_version, name="Event Tracker " + dhis2_version, single_per_period=False
        )

        event_tracker_form.org_unit_types.add(orgunit_type)

        event_tracker_form_version = self.seed_form(
            event_tracker_form,
            datasource,
            credentials,
            mapping_type="EVENT_TRACKER",
            mapping_file="./testdata/seed-data-command-event-tracker-form-mapping.json",
            xls_file="./testdata/seed-data-command-event-tracker-form.xlsx",
        )

        project.forms.add(event_tracker_form)

        self.project = project

        periods = ["201801", "201802", "201803"]
        quarter_periods = ["2018Q1", "2018Q2"]

        print("********* FORM seed done")
        if mode == "seed":
            print("******** delete previous instances")
            print(Instance.objects.filter(org_unit__in=source_version.orgunit_set.all()).delete())

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
                validate=True,
            )

            with transaction.atomic():
                for orgunit in source_version.orgunit_set.all():
                    orgunit.org_unit_type = orgunit_type
                    orgunit.save()

            print("********* generating instances")

            self.seed_instances(
                source_version, event_tracker_form, [None], event_tracker_form_version, fixed_instance_count=1
            )

            self.seed_instances(
                source_version, cvs_form, quarter_periods[0:1], cvs_mapping_version, fixed_instance_count=50
            )
            print("generated", cvs_form.name, cvs_form.instances.count(), "instances")
            self.seed_instances(source_version, quantity_form, periods, quantity_mapping_version)
            print("generated", quantity_form.name, quantity_form.instances.count(), "instances")
            self.seed_instances(source_version, quality_form, quarter_periods, quality_form_version)
            print("generated", quality_form.name, quality_form.instances.count(), "instances")


        if mode == "derived":

            period = "2018Q1"
            for i in cvs_stat_form.instances.filter(period=period).all():
                i.delete()

            from iaso.dhis2.derived_instance_generator import generate_instances

            generate_instances(project, cvs_mapping_version, cvs_stat_mapping_version, period)

            print("generated", cvs_stat_form.name, cvs_stat_form.instances.count(), "instances")

        if mode == "export":
            force = options.get("force")

            print("********* exporting")
            print("fixing categoryOptions sharing", timezone.now())
            self.make_category_options_public(credentials)

            export_periods = quarter_periods[0:1] + periods[0:3]
            print("creating export request ", export_periods, timezone.now())
            export_request = ExportRequestBuilder().build_export_request(
                filters={
                    "period_ids": ",".join(export_periods),
                    "form_ids": ",".join(list(map(str, [quantity_form.id, quality_form.id]))),
                },
                launcher=self.user,
                force_export=force,
            )

            print("exporting", export_request.exportstatus_set.count(), timezone.now())
            DataValueExporter().export_instances(export_request)

        if mode == "stats":
            for c in Instance.objects.with_status().counts_by_status():
                print(c)

        if mode == "fix":
            print("fixing assign all orgunits to program", timezone.now())
            self.assign_orgunits_to_program(credentials)
            print("fixing categoryOptions sharing", timezone.now())
            self.make_category_options_public(credentials)

        print("********")
        print("For Iaso web")
        print("  log into http://localhost:8081/")
        print("  with user and password : ","testemail" + dhis2_version)
        print("")
        print("For Iaso mobile")
        print("  now you need to start ngrok")
        print("     with : ngrok http 8081")
        print("     adapt .env and set the FILE_SERVER_URL to the ngrok https url in Forwarding section")
        print("     restart iaso (so .env is reloaded) : docker-compose up")
        print("  install the generic iaso mobile app and launch the app")
        print("        https://play.google.com/store/apps/details?id=com.bluesquarehub.iaso")
        print("     in the menu ")
        print("        Change the App ID : ", project.app_id)
        print("        Change URL server : with the ngrok one (good luck, try to send it by email)")
        print("     then in the Connection section")
        print("        user and password : ", "testemail" + dhis2_version)


    def assign_orgunits_to_program(self, credentials):
        api = Api(credentials.url, credentials.login, credentials.password)
        program_id = "eBAyeGv0exc"
        orgunits = api.get("organisationUnits", params={"fields": "id", "paging": "false"}).json()["organisationUnits"]
        program = api.get("programs/" + program_id, params={"fields": ":all"}).json()
        program["organisationUnits"] = orgunits
        api.put("programs/" + program_id, program)

    def make_category_options_public(self, credentials):
        api = Api(credentials.url, credentials.login, credentials.password)
        for page in api.get_paged("categoryOptions", params={"fields": ":all"}, page_size=100):
            for category_option in page["categoryOptions"]:
                if category_option["name"] != "default":
                    try:
                        api.post(
                            "sharing?type=categoryOption&id=" + category_option["id"],
                            {
                                "meta": {"allowPublicAccess": True, "allowExternalAccess": False},
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
                    except Exception as e:
                        print("Failed to fix ", category_option["name"], e)

    def seed_form(
        self,
        form,
        datasource,
        credentials,
        mapping_type="AGGREGATE",
        mapping_file=None,
        xls_file="testdata/seed-data-command-form.xlsx",
    ):
        form_version, created = FormVersion.objects.get_or_create(form=form, version_id=1)
        # don't use uploadedFile in get_or_create, it will end up non unique
        form_version.file = UploadedFile(
            # TODO: use better fixture
            open("./testdata/seed-data-command-form.xml")
        )
        form_version.xls_file = UploadedFile(open(xls_file, "rb+"))

        form_version.save()

        if not mapping_file:
            return

        mapping_version_name = mapping_type

        mapping, _mapping_created = Mapping.objects.get_or_create(
            form=form, data_source=datasource, mapping_type=mapping_type
        )

        mapping_version_json = self.mapping_json(mapping_file)

        if MappingVersion.objects.filter(name=mapping_version_name, form_version=form_version).count() == 0:
            MappingVersion.objects.get_or_create(
                name=mapping_version_name, form_version=form_version, mapping=mapping, json=mapping_version_json
            )

        mapping_version, mapping_version_created = MappingVersion.objects.get_or_create(
            name=mapping_version_name, form_version=form_version, mapping=mapping
        )
        mapping_version.json = mapping_version_json
        mapping_version.save()
        return mapping_version

    @transaction.atomic
    def seed_instances(self, source_version, form, periods, mapping_version, fixed_instance_count=None):
        for org_unit in source_version.orgunit_set.all():
            instances = []
            for period in periods:
                if fixed_instance_count and "Clinic" in org_unit.name:
                    instance_by_ou_periods = randint(1, fixed_instance_count)
                else:
                    instance_by_ou_periods = 2 if randint(1, 100) == 50 else 1

                with_location = randint(1, 3) == 2
                # print("generating", form.name, org_unit.name, instance_by_ou_periods)
                for instance_count in range(0, instance_by_ou_periods):
                    instance = Instance(project=self.project)
                    instance.created_at = parse_datetime("2018-02-16T11:00:00+00")
                    instance.org_unit = org_unit
                    instance.period = period
                    instance.file_name = "fake_it_until_you_make_it.xml"
                    instance.uuid = str(uuid4())
                    if with_location:
                        instance.location = Point(-11.7868289 + (2 * random()), 8.4494988 + (2 * random()), 0)

                    test_data = {"_version": 1}

                    if mapping_version and "question_mappings" in mapping_version.json:
                        # quality or quantity
                        for key in mapping_version.json["question_mappings"]:
                            test_data[key] = randint(1, 10)
                    else:
                        # CVS
                        test_data["cs_304"] = randint(1, 100)

                    instance.json = test_data
                    instance.form = form

                    if mapping_version.mapping.is_event_tracker():
                        instance.json.clear()
                        instance.json = {
                            "DE_2005736": "2.5",
                            "DE_2006098": "5",
                            "DE_2006101": "1",
                            "DE_2006103": "Exclusive",
                            "DE_2006104": "3",
                            "DE_2008294": "NVP only",
                            "DE_391382": "dsd",
                            "DE_424405": "",
                            "MMD_PER_NAM": "kid " + str(randint(1, 10000)),
                            "gender": "Male" if randint(1, 10) < 5 else "Female",
                            "is_existing": "0",
                            "last_name": "Skywalker",
                            "_version": 1,
                            "households_note": "",
                            "hh_repeat": [
                                {
                                    "hh_name": "household 1",
                                    "hh_gender": "Male" if randint(1, 10) < 5 else "Female",
                                    "hh_age": randint(18, 65),
                                    "hh_street": "streeet 1",
                                    "hh_number": "44b",
                                    "hh_city": "bxl",
                                },
                                {
                                    "hh_name": "household 2",
                                    "hh_gender": "Male" if randint(1, 10) < 5 else "Female",
                                    "hh_age": randint(18, 65),
                                    "hh_street": "street b",
                                    "hh_number": "45",
                                    "hh_city": "Namur",
                                },
                            ],
                            "instanceID": "uuid:" + instance.uuid,
                        }

                        self.generate_xml_file(instance, form.latest_version)
                    else:
                        instance.json["instanceID"] = "uuid:" + str(uuid4())
                        xml_string = (
                            open("./testdata/seed-data-command-instance.xml")
                            .read()
                            .replace("REPLACEUUID", instance.json["instanceID"])
                        )
                        buffer = BytesIO(xml_string.encode("utf-8"))
                        buffer.seek(0, 2)
                        file = InMemoryUploadedFile(
                            file=buffer,
                            field_name="file",
                            name=instance.file_name,
                            content_type="application/xml",
                            size=buffer.tell(),
                            charset="utf-8",
                        )

                        instance.file = file

                        UploadedFile()

                    instances.append(instance)
            Instance.objects.bulk_create(instances)

    def generate_xml_file(self, instance, form_version):
        xml_string = self.generate_instance_xml(instance, form_version)

        buffer = BytesIO(xml_string)
        buffer.seek(0, 2)  # Seek to the end of the stream, so we can get its length with `buf.tell()`
        instance.file_name = form_version.form.form_id + "_" + instance.uuid
        file = InMemoryUploadedFile(
            file=buffer,
            field_name="file",
            name=instance.file_name,
            content_type="application/xml",
            size=buffer.tell(),
            charset="utf-8",
        )
        instance.file = file

    def generate_instance_xml(self, instance, form_version):
        # create XML
        root = etree.Element("data")

        for k in instance.json.keys():
            # another child with text
            if k != "version" and k != "_version" and k != "instanceID":
                child = etree.Element(k)
                child.text = str(instance.json[k])
                root.append(child)

        root.attrib["version"] = form_version.version_id
        root.attrib["id"] = form_version.form.form_id

        # generate <meta><instanceID>uuid:3679c645-24ec-4860-93ea-fce1d068b58f</instanceID></meta>
        meta = etree.Element("meta")
        root.append(meta)
        instance_id = etree.Element("instanceID")
        instance_id.text = "uuid:" + instance.uuid
        meta.append(instance_id)

        instance_xml = etree.tostring(root, pretty_print=True, encoding="UTF-8")

        return instance_xml

    def mapping_json(self, file):
        with open(file) as json_file:
            return json.load(json_file)
