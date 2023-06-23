import typing
from unittest import mock

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.core.files import File
from django.http import StreamingHttpResponse, HttpResponse
from django.test import TestCase as BaseTestCase
from rest_framework.test import APITestCase as BaseAPITestCase, APIClient

from hat.menupermissions.models import CustomPermissionSupport
from hat.vector_control.models import APIImport
from iaso import models as m


class IasoTestCaseMixin:
    @staticmethod
    def create_user_with_profile(
        *,
        username: str,
        account: m.Account,
        permissions=None,
        org_units: typing.Sequence[m.OrgUnit] = None,
        language: str = None,
        projects: typing.Sequence[m.Project] = None,
        user_roles: typing.Sequence[m.UserRole] = None,
        **kwargs,
    ):
        User = get_user_model()

        user = User.objects.create(username=username, **kwargs)
        m.Profile.objects.create(user=user, account=account)

        if permissions is not None:
            content_type = ContentType.objects.get_for_model(CustomPermissionSupport)
            user.user_permissions.set(Permission.objects.filter(codename__in=permissions, content_type=content_type))

        if org_units is not None:
            user.iaso_profile.org_units.set(org_units)

        if language is not None:
            user.iaso_profile.language = language

        if projects is not None:
            user.iaso_profile.projects.set(projects)

        if user_roles is not None:
            user.iaso_profile.user_roles.set(user_roles)

        return user

    @staticmethod
    def create_form_instance(*, form: m.Form = None, period: str = None, org_unit: m.OrgUnit = None, **kwargs):
        instance_file_mock = mock.MagicMock(spec=File)
        instance_file_mock.name = "test.xml"

        return m.Instance.objects.create(form=form, period=period, org_unit=org_unit, file=instance_file_mock, **kwargs)

    @staticmethod
    def create_file_mock(**kwargs):
        file_mock = mock.MagicMock(spec=File)

        for key, value in kwargs.items():
            setattr(file_mock, key, value)

        return file_mock


class TestCase(BaseTestCase, IasoTestCaseMixin):
    pass


def try_json(response):
    try:
        return response.json()
    except:
        return response.content


class APITestCase(BaseAPITestCase, IasoTestCaseMixin):
    client: APIClient

    def setUp(self):
        """Make sure we have a fresh client at the beginning of each test"""

        self.client = APIClient()

    def assertJSONResponse(self, response: typing.Any, expected_status_code: int):
        self.assertIsInstance(response, HttpResponse)
        self.assertEqual(expected_status_code, response.status_code, try_json(response))

        if expected_status_code != 204:
            self.assertEqual("application/json", response["Content-Type"], try_json(response))

        if response.content:
            return response.json()

    def assertFileResponse(
        self,
        response: typing.Any,
        expected_status_code: int,
        expected_content_type: str,
        *,
        expected_attachment_filename: str = None,
        streaming: bool = False,
    ):
        if streaming:
            self.assertIsInstance(response, StreamingHttpResponse)
            # we need to force the reading of the whole content stream - some errors might be hidden in the generator
            self.assertIsInstance(list(response.streaming_content), list)
        else:
            self.assertIsInstance(response, HttpResponse)
        self.assertEqual(expected_status_code, response.status_code)
        self.assertEqual(expected_content_type, response["Content-Type"])

        if expected_attachment_filename is not None:
            self.assertEquals(
                response.get("Content-Disposition"), f"attachment; filename={expected_attachment_filename}"
            )

    def assertValidListData(
        self,
        *,
        list_data: typing.Mapping,
        results_key: typing.Optional[str],
        expected_length: int,
        paginated: bool = False,
    ):
        if results_key is not None:  # typical list case: we have a specific result key
            self.assertIn(results_key, list_data)
            self.assertIsInstance(list_data[results_key], list)
            self.assertEqual(expected_length, len(list_data[results_key]))
        else:  # if straightforward list responses without result keys, for custom list methods or bulk create
            self.assertIsInstance(list_data, list)
            self.assertEqual(expected_length, len(list_data))

        if paginated:
            self.assertHasField(list_data, "has_next", bool)
            self.assertHasField(list_data, "has_previous", bool)
            self.assertHasField(list_data, "page", int)
            self.assertHasField(list_data, "pages", int)
            self.assertHasField(list_data, "limit", int)

    def assertHasField(self, data: typing.Mapping, field_name: str, cls: type, *, optional: bool = False):
        if not optional:
            self.assertIn(field_name, data)

        if field_name in data and (not optional or data[field_name] is not None):
            self.assertIsInstance(data[field_name], cls)

    def assertHasError(self, data: typing.Mapping, field_name: str, error_message: str = None):
        self.assertIn(field_name, data)
        if error_message is not None:
            self.assertIn(error_message, data[field_name])

    def assertAPIImport(
        self,
        import_type: str,
        *,
        request_body: typing.Any,
        has_problems: bool,
        check_auth_header: bool = False,
        exception_contains_string: str = None,
    ):
        """Make sure that a APIImport has been correctly generated"""

        last_api_import = APIImport.objects.order_by("-created_at").first()
        assert last_api_import is not None
        self.assertIsNotNone(last_api_import)
        self.assertIsInstance(last_api_import.headers, dict)
        self.assertEqual(last_api_import.json_body, request_body)
        self.assertEqual(last_api_import.import_type, import_type)
        self.assertEqual(has_problems, last_api_import.has_problem, last_api_import)

        self.assertIsInstance(last_api_import.headers, dict)
        if check_auth_header:
            self.assertIsInstance(last_api_import.headers["HTTP_AUTHORIZATION"], str)
            self.assertEqual("Bearer ", last_api_import.headers["HTTP_AUTHORIZATION"][:7])

        if has_problems is False:
            self.assertEqual(last_api_import.exception, "")
        elif exception_contains_string is not None:
            self.assertTrue(exception_contains_string in last_api_import.exception)

    def assertValidProjectData(self, project_data: typing.Mapping):
        self.assertHasField(project_data, "id", int)
        self.assertHasField(project_data, "name", str)
        self.assertHasField(project_data, "feature_flags", list)
        self.assertHasField(project_data, "created_at", float)
        self.assertHasField(project_data, "updated_at", float)
        self.assertHasField(project_data, "needs_authentication", bool)
