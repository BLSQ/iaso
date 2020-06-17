from uuid import uuid4
from django.core.files import File
from django.core.management.base import BaseCommand

from iaso import periods
from iaso.models import Form, FormVersion, OrgUnit, OrgUnitType, Project, Instance, Device, Account
from iaso.odk import parsing


class Command(BaseCommand):
    help = "Create a simple form with a few versions and some instances."

    def add_arguments(self, parser):  # TODO: remove me
        parser.add_argument(
            "account_id",
            help="The project to which the form should be linked",
        )

    def handle(self, *args, **options):
        Instance.objects.filter(name="FOSA_PLAN_CAR (ssf)").delete()
        Form.objects.filter(name="FOSA_PLAN_CAR (ssf)").delete()
        Device.objects.filter(imei="ssf1230403").delete()
        OrgUnit.objects.filter(name="Centre de santé quelque part (ssf)").delete()
        OrgUnitType.objects.filter(name="Centre de santé (ssf)").delete()
        Project.objects.filter(name="Test project (ssf)").delete()

        project = Project.objects.create(name="Test project (ssf)",
                                         account=Account.objects.get(pk=options["account_id"]))

        device = Device.objects.create(imei="ssf1230403")
        device.projects.add(project)

        health_center = OrgUnitType.objects.create(name="Centre de santé (ssf)", short_name="Centre")
        health_center.projects.add(project)

        health_center_somewhere = OrgUnit.objects.create(name="Centre de santé quelque part (ssf)",
                                                         org_unit_type=health_center)

        form = Form.objects.create(name="FOSA_PLAN_CAR (ssf)", form_id="FOSA_PLAN_CAR", device_field="deviceid",
                                   period_type=periods.PERIOD_TYPE_QUARTER)
        form.projects.add(project)

        with open("iaso/fixtures/FOSA_PLAN_CAR_2020030201.xlsx", "rb") as form_version_1_file:
            survey = parsing.parse_xls_form(form_version_1_file)
            form_version_1 = FormVersion.objects.create_for_form_and_survey(
                form=form, survey=survey, xls_file=File(form_version_1_file)
            )

        with open("iaso/fixtures/FOSA_PLAN_CAR_2020030301.xlsx", "rb") as form_version_2_file:
            survey = parsing.parse_xls_form(form_version_2_file, previous_version=form_version_1.version_id)
            FormVersion.objects.create_for_form_and_survey(
                form=form, survey=survey, xls_file=File(form_version_2_file)
            )

        with open("iaso/fixtures/FOSA_PLAN_CAR_2_2020-03-03_15-37-28.xml", "rb") as instance_1_file:
            Instance.objects.create(uuid=uuid4(), export_id=uuid4(), name="FOSA_PLAN_CAR (ssf)",
                                    file=File(instance_1_file),
                                    file_name="FOSA_PLAN_CAR_2_2020-03-03_15-37-28.xml",
                                    location="SRID=4326;POINT Z (4.4008725 50.8366993 0)",
                                    org_unit=health_center_somewhere, form=form, project=project, accuracy=17.95,
                                    device=device,
                                    period="2019Q3")
