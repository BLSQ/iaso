from pprint import pprint
from iaso.test import APITestCase
from django.utils.timezone import now
from django.contrib.auth.models import AnonymousUser
from iaso import models as m
from iaso.models import Workflow, WorkflowVersion
from iaso.models.workflow import WorkflowVersionsStatus
from unittest import mock
from django.core.files.uploadedfile import UploadedFile
from django.core.files import File


def var_dump(what):
    if type(what) is dict:
        pprint(what)
    else:
        pprint(what.__dict__)


class BaseWorkflowsAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.now = now()

        blue_adults = m.Account.objects.create(name="Blue Adults")
        blue_children = m.Account.objects.create(name="Blue Children")

        cls.anon = AnonymousUser()

        cls.blue_adult_1 = cls.create_user_with_profile(
            username="blue_adult_1", account=blue_adults, permissions=["iaso_workflows"]
        )

        cls.blue_child_1 = cls.create_user_with_profile(
            username="blue_child_1",
            account=blue_children,
            permissions=["iaso_workflows"],
        )

        # He doesn't have permissions
        cls.blue_adult_np = cls.create_user_with_profile(username="blue_adult_np", account=blue_adults)

        cls.project_blue_adults = m.Project.objects.create(
            name="Blue Adults Project",
            app_id="blue.adults.project",
            account=blue_adults,
        )

        cls.form_adults_blue = m.Form.objects.create(
            name="Blue Adults Form", form_id="adults_form_blue", created_at=cls.now
        )

        cls.form_adults_blue_2 = m.Form.objects.create(
            name="Blue Adults Form 2", form_id="adults_form_blue_2", created_at=cls.now
        )

        form_adults_blue_mock = mock.MagicMock(spec=File)
        form_adults_blue_mock.name = "test.xml"
        with open("iaso/tests/fixtures/form_test_workflow.xlsx", "rb") as xls_file:
            cls.form_adults_blue.form_versions.create(
                file=form_adults_blue_mock, xls_file=UploadedFile(xls_file), version_id="2020022401"
            )

        cls.form_adults_blue.update_possible_fields()
        cls.form_adults_blue.save()

        form_adults_blue_2_mock = mock.MagicMock(spec=File)
        form_adults_blue_2_mock.name = "test.xml"
        with open("iaso/tests/fixtures/form_test_workflow.xlsx", "rb") as xls_file:
            cls.form_adults_blue_2.form_versions.create(
                file=form_adults_blue_2_mock, xls_file=UploadedFile(xls_file), version_id="2020022301"
            )

        cls.form_adults_blue_2.update_possible_fields()
        cls.form_adults_blue_2.save()

        cls.form_children_blue = m.Form.objects.create(
            name="Blue Children Form", form_id="children_form_blue", created_at=cls.now
        )

        cls.project_blue_adults.forms.add(cls.form_adults_blue)
        cls.project_blue_adults.forms.add(cls.form_adults_blue_2)
        cls.project_blue_adults.save()

        cls.et_children_blue = m.EntityType.objects.create(
            name="Children of Blue",
            created_at=cls.now,
            account=blue_children,
            reference_form=cls.form_children_blue,
        )

        cls.workflow_et_children_blue = Workflow.objects.create(entity_type=cls.et_children_blue)

        cls.workflow_version_et_children_blue = WorkflowVersion.objects.create(
            workflow=cls.workflow_et_children_blue,
            name="workflow_version_et_children_blue V1",
            status=WorkflowVersionsStatus.DRAFT,
        )

        cls.et_adults_blue = m.EntityType.objects.create(
            name="Adults of Blue",
            created_at=cls.now,
            account=blue_adults,
            reference_form=cls.form_adults_blue,
        )
        cls.workflow_et_adults_blue = Workflow.objects.create(entity_type=cls.et_adults_blue)

        cls.workflow_version_et_adults_blue = WorkflowVersion.objects.create(
            workflow=cls.workflow_et_adults_blue,
            name="workflow_version_et_adults_blue V1",
            status=WorkflowVersionsStatus.PUBLISHED,
        )
        cls.workflow_version_et_adults_blue_draft_2 = WorkflowVersion.objects.create(
            workflow=cls.workflow_et_adults_blue,
            name="workflow_version_et_adults_blue V2 draft",
            status=WorkflowVersionsStatus.DRAFT,
        )

        cls.workflow_version_et_adults_blue_draft = WorkflowVersion.objects.create(
            workflow=cls.workflow_et_adults_blue,
            name="workflow_version_et_adults_blue V2",
            status=WorkflowVersionsStatus.DRAFT,
        )
