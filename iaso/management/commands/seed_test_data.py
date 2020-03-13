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

import json

"""

to be able to export

run this in taskr (TODO port it to python)
// https://play.dhis2.org/2.30/api/apps/Dhis2-Taskr/index.html
const api = await dhis2.api();
const ou = await api.get("categoryOptions", {
  fields: ":all",
  paging: false
});

for (categoryOption of ou.categoryOptions) {
  await api.post(
    "/sharing?type=categoryOption&id=" + categoryOption.id,

    {
      meta: { allowPublicAccess: true, allowExternalAccess: false },

      object: {
        id: categoryOption.id,
        name: categoryOption.name,
        displayName: categoryOption.displayName,
        publicAccess: "rwrw----",

        user: categoryOption.user,
        externalAccess: false
      }
    }
  );
}

return ou.organisationUnits;
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
        form, created = Form.objects.get_or_create(
            form_id="quality_pca_" + dhis2_version,
            name="Quality PCA form " + dhis2_version,
            period_type="MONTH",
            single_per_period=True,
        )
        project.forms.add(form)
        orgunit_type, created = OrgUnitType.objects.get_or_create(
            name="FosaPlay", short_name="FosaPlay"
        )
        form.org_unit_types.add(orgunit_type)
        project.save()
        self.form = form
        self.project = project
        form_version, created = FormVersion.objects.get_or_create(
            form=form,
            version_id=1,
            file=UploadedFile(open("iaso/tests/fixtures/hydroponics_test_upload.xml")),
        )  # TODO: use better fixture

        self.form = form
        self.form_version = form_version

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

        mapping_version_json = self.mapping_json(
            "./testdata/seed-data-command-form-mapping.json"
        )

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
        periods = ["201801", "201802", "201803", "201804", "201805", "201806"]

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
            print("generated", form.instances.count(), "instances")

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
            for c in Instance.objects.with_status().counts_by_status():
                print(c)

    @transaction.atomic
    def seed_instances(self, source_version, form, periods, mapping_version):
        for org_unit in source_version.orgunit_set.all():
            for period in periods:
                instance_by_ou_periods = 2 if randint(1, 100) == 50 else 1
                for instance_count in range(0, instance_by_ou_periods):
                    instance = Instance(project=self.project)
                    instance.created_at = parse_datetime("2018-02-16T11:00:00+00")
                    instance.org_unit = org_unit
                    instance.period = period

                    test_data = {"_version": 1}

                    for key in mapping_version.json["question_mappings"]:
                        test_data[key] = randint(1, 10)

                    instance.json = test_data
                    instance.form = self.form
                    instance.file = UploadedFile(
                        open("iaso/tests/fixtures/hydroponics_test_upload.xml")
                    )
                    instance.save()
                    # force to past creation date
                    # looks the the first save don't take it
                    instance.created_at = parse_datetime("2018-02-16T11:00:00+00")
                    instance.save()

    def mapping_json(self, file):
        with open(file) as json_file:
            return json.load(json_file)
