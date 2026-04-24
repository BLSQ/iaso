from unittest import mock

from django.core.files import File
from django.core.management import call_command
from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.models import MONTH, Account, DataSource, Form, OrgUnit, OrgUnitType, Project, SourceVersion
from iaso.test import IasoTestCaseMixin

from .permissions import IsTestModeEnabled


@extend_schema(tags=["FT Helpers"])
class FunctionalTestHelperViewSet(viewsets.ViewSet):
    permission_classes = [IsTestModeEnabled]

    @action(detail=False, methods=["POST"], url_path="create-user")
    def create_user(self, request):
        data_source = DataSource.objects.create(name="counsil")
        version = SourceVersion.objects.create(data_source=data_source, number=1)
        default_account = Account.objects.create(
            name="Star Wars", default_version=version, enforce_password_validation=False
        )
        yoda = IasoTestCaseMixin.create_user_with_profile(username="yoda", account=default_account)

        yoda.set_password("IMomLove")
        yoda.save()

        jedi_council = OrgUnitType.objects.create(name="Jedi Council", short_name="Cnc")

        jedi_council_corruscant = OrgUnit.objects.create(name="Corruscant Jedi Council")

        project = Project.objects.create(
            name="Hydroponic gardens",
            app_id="stars.empire.agriculture.hydroponics",
            account=default_account,
            needs_authentication=True,
        )

        form_1 = Form.objects.create(name="Hydroponics study", period_type=MONTH, single_per_period=True)

        form_2 = Form.objects.create(
            name="Hydroponic public survey",
            form_id="sample2",
            device_field="deviceid",
            location_field="geoloc",
            period_type="QUARTER",
            single_per_period=True,
        )
        form_2_file_mock = mock.MagicMock(spec=File)
        form_2_file_mock.name = "test.xml"
        form_2.form_versions.create(file=form_2_file_mock, version_id="2020022401")
        form_2.org_unit_types.add(jedi_council)
        IasoTestCaseMixin.create_form_instance(
            form=form_2, period="202001", org_unit=jedi_council_corruscant, project=None
        )
        form_2.save()

        project.unit_types.add(jedi_council)
        project.forms.add(form_1)
        project.forms.add(form_2)
        project.save()

        # account = Account.objects.get_or_create(name="rand_account", enforce_password_validation=False)[0]
        # get_user_model().objects.filter(username="test_rand").delete()
        # user = IasoTestCaseMixin.create_user_with_profile(username="test_rand", account=account, is_superuser=True, is_staff=True, password="1234")
        return Response({}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["POST"], url_path="clean-database")
    def clean_database(self, request):
        call_command("flush", "--noinput")
        return Response(status=status.HTTP_204_NO_CONTENT)
