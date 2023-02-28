from uuid import uuid4

from django.conf import settings
from django.core.files import File
from django.core.management.base import BaseCommand, CommandError

from iaso import periods
from iaso.models import Form, FormVersion, OrgUnit, OrgUnitType, Project, Instance, Device, Account
from iaso.odk import parsing


class Command(BaseCommand):
    help = "Create a simple form with a few versions and some instances."

    def add_arguments(self, parser):
        parser.add_argument("account_id", help="The account to which the form should be linked")

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("Cannot use this command in non-debug mode")

        Instance.objects.filter(name="Test form 1 (ssf)").delete()
        Instance.objects.filter(name="Test form 2 (ssf)").delete()
        Form.objects.filter(name="Test form 1 (ssf)").delete()
        Form.objects.filter(name="Test form 2 (ssf)").delete()
        Device.objects.filter(imei="ssf123456").delete()
        OrgUnit.objects.filter(name="Test org unit (ssf)").delete()
        OrgUnitType.objects.filter(name="Test org unit type (ssf)").delete()
        Project.objects.filter(name="Test project (ssf)").delete()

        project = Project.objects.create(
            name="Test project (ssf)", account=Account.objects.get(pk=options["account_id"])
        )

        device = Device.objects.create(imei="ssf123456")
        device.projects.add(project)

        org_unit_type = OrgUnitType.objects.create(name="Test org unit type (ssf)", short_name="Ou")
        org_unit_type.projects.add(project)

        org_unit = OrgUnit.objects.create(name="Test org unit (ssf)", org_unit_type=org_unit_type)

        form_1 = Form.objects.create(
            name="Test form 1 (ssf)",
            form_id="QOC-HD-00000_v6",
            device_field="deviceid",
            period_type=periods.PERIOD_TYPE_QUARTER,
            periods_before_allowed=6,
            periods_after_allowed=6,
            single_per_period=True,
        )

        form_2 = Form.objects.create(
            name="Test form 2 (ssf)",
            form_id="qlty_pca_fosa_malnutrition_fighting",
            device_field="deviceid",
            period_type=periods.PERIOD_TYPE_QUARTER,
            periods_before_allowed=3,
            periods_after_allowed=3,
            single_per_period=True,
        )
        form_1.org_unit_types.add(org_unit_type)
        form_2.org_unit_types.add(org_unit_type)
        form_1.projects.add(project)
        form_2.projects.add(project)

        with open("iaso/fixtures/form_1.xlsx", "rb") as form_1_version_1_file:
            survey = parsing.parse_xls_form(form_1_version_1_file)
            form_version_1 = FormVersion.objects.create_for_form_and_survey(
                form=form_1, survey=survey, xls_file=File(form_1_version_1_file)
            )
            form_version_1.version_id = "2020060801"  # force version to match instance files
            form_version_1.save()

        with open("iaso/fixtures/form_2.xlsx", "rb") as form_2_version_1_file:
            survey = parsing.parse_xls_form(form_2_version_1_file)
            form_version_1 = FormVersion.objects.create_for_form_and_survey(
                form=form_2, survey=survey, xls_file=File(form_2_version_1_file)
            )
            form_version_1.version_id = "2020030401"  # force version to match instance files
            form_version_1.save()

        with open("iaso/fixtures/instance_form_1_1.xml", "rb") as form_1_instance_1_file:
            Instance.objects.create(
                uuid=uuid4(),
                export_id=uuid4(),
                name="Test form 1 (ssf)",
                file=File(form_1_instance_1_file),
                file_name="instance_form_1_1.xml",
                location="SRID=4326;POINT Z (-17.4586282 14.7456688 0)",
                org_unit=org_unit,
                form=form_1,
                project=project,
                accuracy=25.00,
                device=device,
                period="2020Q1",
            )

        with open("iaso/fixtures/instance_form_2_1.xml", "rb") as form_2_instance_1_file:
            Instance.objects.create(
                uuid=uuid4(),
                export_id=uuid4(),
                name="Test form 2 (ssf)",
                file=File(form_2_instance_1_file),
                file_name="instance_form_2_1.xml",
                location="SRID=4326;POINT Z (-17.4586282 14.7456688 0)",
                org_unit=org_unit,
                form=form_2,
                project=project,
                accuracy=25.00,
                device=device,
                period="2020Q1",
            )
