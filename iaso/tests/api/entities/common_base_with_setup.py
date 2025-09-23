import uuid

from django.contrib.auth.models import AnonymousUser

from iaso import models as m
from iaso.permissions.core_permissions import CORE_ENTITIES_PERMISSION
from iaso.test import APITestCase


class EntityAPITestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = m.Account.objects.create(name="Account")
        sw_source = m.DataSource.objects.create(name="Source")
        cls.sw_source = sw_source
        sw_version = m.SourceVersion.objects.create(data_source=sw_source, number=1)
        cls.account.default_version = sw_version
        cls.account.save()
        cls.sw_version = sw_version

        cls.anon = AnonymousUser()

        cls.project = m.Project.objects.create(name="Project", app_id="project", account=cls.account)

        cls.yop_solo = cls.create_user_with_profile(
            username="yop solo",
            account=m.Account.objects.create(name="Account 2"),
            permissions=[CORE_ENTITIES_PERMISSION],
        )

        cls.ou_country = m.OrgUnit.objects.create(
            name="Burkina Faso (validated)", validation_status=m.OrgUnit.VALIDATION_VALID
        )
        cls.ou_country_unvalidated = m.OrgUnit.objects.create(name="Burkina Faso (unvalidated)")

        cls.yoda = cls.create_user_with_profile(
            username="yoda", account=cls.account, permissions=[CORE_ENTITIES_PERMISSION]
        )

        cls.user_without_ou = cls.create_user_with_profile(
            username="user_without_ou", account=cls.account, permissions=[CORE_ENTITIES_PERMISSION]
        )

        cls.form_1 = m.Form.objects.create(
            name="Hydroponics study",
            period_type=m.MONTH,
            single_per_period=True,
            form_id="form_1",
        )

        cls.create_form_instance(form=cls.form_1, org_unit=cls.ou_country, project=cls.project, uuid=uuid.uuid4())
        cls.create_form_instance(form=cls.form_1, org_unit=cls.ou_country, project=cls.project, uuid=uuid.uuid4())
        cls.create_form_instance(form=cls.form_1, org_unit=cls.ou_country, project=cls.project, uuid=uuid.uuid4())
        cls.create_form_instance(form=cls.form_1, org_unit=cls.ou_country, project=cls.project, uuid=uuid.uuid4())

        cls.form_1.projects.add(cls.project)

        cls.entity_type = m.EntityType.objects.create(name="Type 1", reference_form=cls.form_1, account=cls.account)
