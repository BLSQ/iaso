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

        Instance.objects.filter(name="CSI - Quantite - Valide (ssf)").delete()
        Form.objects.filter(name="CSI - CS - Quantite - Valide (ssf)").delete()
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

        form = Form.objects.create(name="CSI - CS - Quantite - Valide (ssf)", form_id="ne_csi_quantite", device_field="deviceid",
                                   period_type=periods.PERIOD_TYPE_MONTH, periods_before_allowed=15, periods_after_allowed=3, single_per_period=True)
        form.org_unit_types.add(health_center)
        form.projects.add(project)

        with open("iaso/fixtures/csi_quantite_valide_2020051401.xlsx", "rb") as form_version_1_file:
            survey = parsing.parse_xls_form(form_version_1_file)
            form_version_1 = FormVersion.objects.create_for_form_and_survey(
                form=form, survey=survey, xls_file=File(form_version_1_file)
            )
            form_version_1.version_id = "2020051401"  # force version to match instance files
            form_version_1.save()

        with open("iaso/fixtures/csi_quantite_valide_2020051402.xlsx", "rb") as form_version_2_file:
            survey = parsing.parse_xls_form(form_version_2_file, previous_version=form_version_1.version_id)
            form_version_2 = FormVersion.objects.create_for_form_and_survey(
                form=form, survey=survey, xls_file=File(form_version_2_file)
            )
            form_version_2.version_id="2020051402"
            form_version_2.save()

        with open("iaso/fixtures/79_3_2020-05-08_15-01-54.xml", "rb") as instance_1_file:
            Instance.objects.create(uuid=uuid4(), export_id=uuid4(), name="CSI - Quantite - Valide (ssf)",
                                    file=File(instance_1_file),
                                    file_name="79_3_2020-05-08_15-01-54.xml",
                                    location="SRID=4326;POINT Z (-17.4586282 14.7456688 0)",
                                    org_unit=health_center_somewhere, form=form, project=project, accuracy=3000.00,
                                    device=device,
                                    period="202002")

        with open("iaso/fixtures/79_2020-04-07_14-47-25.xml", "rb") as instance_2_file:
            Instance.objects.create(uuid=uuid4(), export_id=uuid4(), name="CSI - Quantite - Valide (ssf)",
                                    file=File(instance_2_file),
                                    file_name="79_2020-04-07_14-47-25.xml",
                                    location="SRID=4326;POINT Z (-17.4590048 14.7449495 0)",
                                    org_unit=health_center_somewhere, form=form, project=project, accuracy=20.00,
                                    device=device,
                                    period="202001")
