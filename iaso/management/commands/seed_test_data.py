import csv
import json
from io import BytesIO
from random import randint, random
from uuid import uuid4

import requests
from dhis2 import Api
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.contrib.gis.geos import Point
from django.contrib.sites.models import Site
from django.core import management
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.files.uploadedfile import UploadedFile
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from lxml import etree

from iaso.dhis2.datavalue_exporter import DataValueExporter
from iaso.dhis2.export_request_builder import ExportRequestBuilder
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
from iaso.models.base import AccountFeatureFlag
from iaso.models.comment import CommentIaso
from iaso.models.device import Device
from iaso.models.entity import Entity, EntityType
from iaso.models.microplanning import Planning, Team
from iaso.models.pages import Page

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
        parser.add_argument("--dhis2version", type=str, help="seed or export", required=True, default="2.38.3")
        parser.add_argument("-f", "--force", action="store_true", help="Force the re-export of exported submissions")

    def handle(self, *args, **options):
        dhis2_version = options.get("dhis2version")

        response = requests.get(f"http://play.dhis2.org/{dhis2_version}")
        dhis2_url = response.url.replace("/dhis-web-commons/security/login.action", "")
        dhis2_version = dhis2_url.split("/")[-1]
        print("dhis2_version resolved to ", dhis2_version)

        mode = options.get("mode")

        account, account_created = Account.objects.get_or_create(name="Organisation Name" + dhis2_version)

        for feat in AccountFeatureFlag.objects.all():
            account.feature_flags.add(feat)

        user, user_created = User.objects.get_or_create(
            username="testemail" + dhis2_version, email="testemail" + dhis2_version + "@bluesquarehub.com"
        )
        user.name = "testemail" + dhis2_version
        user.save()
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

        project.app_id = "org.bluesquare.play"
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

        page, _page_created = Page.objects.get_or_create(
            account=account, name=f"dhis2{dhis2_version}", slug=f"dhis2{dhis2_version}"
        )

        page.type = "RAW"
        page.content = f"<html><body>https://play.dhis2.org/{dhis2_version}</body></html>"

        page.save()
        user.pages.add(page)

        orgunit_type, created = OrgUnitType.objects.get_or_create(name="FosaPlay", short_name="FosaPlay")
        orgunit_type.projects.add(project)
        site = Site.objects.first()
        content_type = ContentType.objects.filter(model="orgunit").first()

        with transaction.atomic():
            for orgunit in source_version.orgunit_set.all():
                orgunit.org_unit_type = orgunit_type
                orgunit.save()

                newComment = CommentIaso(
                    user=user,
                    comment="demo comment",
                    object_pk=orgunit.id,
                    content_type=content_type,
                    site=site,
                )

                newComment.save()

        # quantity
        quantity_form, created = Form.objects.get_or_create(
            form_id="quantity_pca_" + dhis2_version,
            name="Quantity PCA form " + dhis2_version,
            period_type="MONTH",
            single_per_period=True,
        )
        quantity_form.device_field = "imei"
        quantity_form.save()

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

        quality_form.device_field = "imei"
        quality_form.save()

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
        cvs_form.device_field = "imei"
        cvs_form.save()

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

        event_tracker_form.device_field = "imei"
        event_tracker_form.save()

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

        entity_form, created = Form.objects.get_or_create(
            form_id="entity_form" + dhis2_version, name="Entity form " + dhis2_version, single_per_period=False
        )

        entity_form.device_field = "imei"
        entity_form.possible_fields = [
            {"name": "What_is_the_father_s_name", "type": "text", "label": "Father's name"},
            {"name": "What_is_the_child_s_name", "type": "text", "label": "Prénom"},
        ]
        entity_form.label_keys = ["What_is_the_child_s_name", "What_is_the_father_s_name"]
        entity_form.save()

        entity_form.org_unit_types.add(orgunit_type)
        project.forms.add(entity_form)

        entity_form_version = self.seed_form(
            entity_form,
            datasource,
            credentials,
            xls_file="./testdata/seed-data-command-entity-form.xlsx",
            xls_xml_file="./testdata/seed-data-command-entity-form.xml",
        )

        entity_type, created = EntityType.objects.get_or_create(
            account=account, name="Child", reference_form=entity_form
        )
        entity_type.fields_list_view = entity_form.label_keys
        entity_type.save()

        self.project = project

        periods = ["201801", "201802", "201803"]
        quarter_periods = ["2018Q1", "2018Q2"]

        print("********* FORM seed done")
        if mode == "seed":
            print("******** delete previous instances and plannings")
            print(Planning.objects.filter(org_unit__in=source_version.orgunit_set.all()).delete())
            print(Instance.objects.filter(org_unit__in=source_version.orgunit_set.all()).update(entity=None))
            print(Entity.objects.filter(account=account).delete())
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

            self.seed_entities(source_version, entity_form, entity_form_version, account, project, entity_type, user)

            self.seed_micro_planning(source_version, project, user)

            print("********* generating instances")

            self.seed_instances(
                dhis2_version,
                source_version,
                event_tracker_form,
                [None],
                event_tracker_form_version,
                fixed_instance_count=1,
            )
            print("generated", event_tracker_form.name, event_tracker_form.instances.count(), "instances")

            self.seed_instances(
                dhis2_version,
                source_version,
                cvs_form,
                quarter_periods[0:1],
                cvs_mapping_version,
                fixed_instance_count=50,
            )
            print("generated", cvs_form.name, cvs_form.instances.count(), "instances")
            self.seed_instances(dhis2_version, source_version, quantity_form, periods, quantity_mapping_version)
            print("generated", quantity_form.name, quantity_form.instances.count(), "instances")
            self.seed_instances(dhis2_version, source_version, quality_form, quarter_periods, quality_form_version)
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
        print("  with user and password : ", "testemail" + dhis2_version)
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
        xls_xml_file="./testdata/seed-data-command-form.xml",
    ):
        form_version, created = FormVersion.objects.get_or_create(form=form, version_id=1)
        # don't use uploadedFile in get_or_create, it will end up non-unique
        form_version.file = UploadedFile(
            # TODO: use better fixture
            open(xls_xml_file)
        )
        form_version.xls_file = UploadedFile(open(xls_file, "rb+"))

        form_version.save()

        if not mapping_file:
            return form_version

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
    def seed_entities(self, source_version, form, form_version, account, project, entity_type, user):
        print("********* seeding entities")
        reader = csv.DictReader(open("./testdata/seed-data-command-names.csv"))
        names = [line for line in reader]

        for org_unit in source_version.orgunit_set.all()[0:1000]:
            name = names[randint(0, len(names) - 1)]
            firstname = names[randint(0, len(names) - 1)]
            entityUuid = str(uuid4())
            entityTypeId = entity_type.id

            entity, created = Entity.objects.get_or_create(
                uuid=entityUuid, entity_type_id=entityTypeId, account=account
            )

            instance = Instance(project=project)
            instance.created_at = parse_datetime("2018-02-16T11:00:00+00")
            instance.org_unit = org_unit
            instance.form = form
            instance.file_name = "fake_it_until_you_make_it.xml"
            instance.uuid = str(uuid4())
            instance.created_by = user
            instance.json = {
                "entityUuid": entityUuid,
                "entityTypeId": entityTypeId,
                "What_is_the_child_s_name": name["name"],
                "What_is_the_father_s_name": firstname["name"],
                "_version": str(1),
            }
            with_location = randint(1, 3) == 2
            if with_location:
                instance.location = Point(-11.7868289 + (2 * random()), 8.4494988 + (2 * random()), 0)
            instance.entity = entity
            instance.save()
            entity.attributes = instance
            entity.name = " ".join([str(instance.json[k]) for k in form.label_keys])
            entity.save()

            self.generate_xml_file(instance, form_version)
            instance.save()

    @transaction.atomic
    def seed_instances(self, dhis2_version, source_version, form, periods, mapping_version, fixed_instance_count=None):
        out = OrgUnitType.objects.filter(orgunit__version=source_version).distinct()
        form.org_unit_types.set(out)
        for org_unit in source_version.orgunit_set.all():
            instances = []
            for period in periods:
                if fixed_instance_count and "Clinic" in org_unit.name:
                    instance_by_ou_periods = randint(1, fixed_instance_count)
                else:
                    rand = randint(1, 100)
                    # Randomise the number of submissions for this period and ou
                    if rand == 1:
                        instance_by_ou_periods = 2
                    elif 2 <= rand < 6:
                        instance_by_ou_periods = 0
                    else:
                        instance_by_ou_periods = 1

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
                            "imei": "testimeivalue" + str(randint(1, 100)),
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
                        instance.json["imei"] = "testimeivalue" + str(randint(1, 100))

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

                    if instance.json["imei"] is not None:
                        device, created = Device.objects.get_or_create(imei=instance.json["imei"])
                        instance.device = device
                        if created:
                            device.projects.add(instance.project)

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

        root.attrib["version"] = str(form_version.version_id)
        root.attrib["id"] = str(form_version.form.form_id)

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

    def seed_micro_planning(self, source_version, project, user):
        print("********* seed_micro_planning")
        team1, _ignore1 = Team.objects.get_or_create(
            project=project, name="team 1", description="team 1", type="TEAM_OF_USERS", manager=user
        )
        team2, _ignore2 = Team.objects.get_or_create(
            project=project, name="team 2", description="", type="TEAM_OF_USERS", manager=user
        )
        team3, _ignore3 = Team.objects.get_or_create(
            project=project, name="team 3", description="", type="TEAM_OF_USERS", manager=user
        )
        team4, _ignore4 = Team.objects.get_or_create(
            project=project, name="team 4", description="", type="TEAM_OF_USERS", manager=user
        )
        team5, _ignore5 = Team.objects.get_or_create(
            project=project, name="team 5", description="", type="TEAM_OF_USERS", manager=user
        )
        basic_teams = [team1, team2, team3, team4, team5]

        team_main, _ignore1 = Team.objects.get_or_create(
            project=project, name="team-main", type="TEAM_OF_TEAMS", manager=user
        )

        for sub_team in basic_teams:
            sub_team.users.set([user])
            team_main.sub_teams.add(sub_team)
            sub_team.calculate_paths(force_recalculate=True)
            sub_team.save()

        team_main.calculate_paths(force_recalculate=True)
        team_main.save()

        country = source_version.orgunit_set.filter(source_ref="ImspTQPwCqd").first()
        print("country ", country.name)

        p = Planning.objects.create(project=project, name="planning-cvs", team=team_main, org_unit=country)

        child_index = 0
        for region in country.children():
            assigned_team = basic_teams[child_index % len(basic_teams)]
            print(" assigning", region.name, assigned_team.name)
            for child_org_unit in region.descendants():
                p.assignment_set.get_or_create(org_unit=child_org_unit, team=assigned_team, user=user)
            child_index += 1

        Planning.objects.get_or_create(
            project=self.project, name="planning-vaccination", team=team_main, org_unit=country
        )
