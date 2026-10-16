from iaso.models import Account, EntityType, Form, MissionForm, OrgUnitType, Project
from iaso.models.missions import (
    MissionEntityType,
    MissionFormThroughForm,
    MissionOrgUnitType,
)
from iaso.permissions.core_permissions import CORE_MISSION_READ_PERMISSION, CORE_MISSION_WRITE_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class MissionAPIRetrieveBaseTestCase(SwaggerTestCaseMixin, APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.account = Account.objects.create(name="account")
        cls.other_account = Account.objects.create(name="other_account")

        cls.user_other_account = cls.create_user_with_profile(
            username="jane_doe", email="", password="", account=cls.other_account
        )
        cls.user_account_no_perm = cls.create_user_with_profile(
            username="john_doe", email="", password="", account=cls.other_account
        )
        cls.user_account_read_perm = cls.create_user_with_profile(
            username="john_wick_read",
            email="",
            password="",
            account=cls.account,
            permissions=[CORE_MISSION_READ_PERMISSION],
        )
        cls.user_account_write_perm = cls.create_user_with_profile(
            username="john_wick_write",
            email="",
            password="",
            account=cls.account,
            permissions=[CORE_MISSION_WRITE_PERMISSION],
        )
        cls.superuser = cls.create_user_with_profile(
            username="john_wick_superuser",
            email="",
            password="",
            account=cls.account,
            permissions=[],
            is_superuser=True,
        )

        # create some data

        cls.project = Project.objects.create(name="project", account=cls.account)
        cls.project_other_account = Project.objects.create(name="project", account=cls.other_account)

        # entity types
        cls.et = EntityType.objects.create(name="et", account=cls.account)
        cls.et_2 = EntityType.objects.create(name="et2", account=cls.account)
        cls.et_3 = EntityType.objects.create(name="et3", account=cls.account)
        cls.et_other_account = EntityType.objects.create(name="et3", account=cls.other_account)

        # out

        cls.out = OrgUnitType.objects.create(name="out")
        cls.out_2 = OrgUnitType.objects.create(name="out2")
        cls.out_3 = OrgUnitType.objects.create(name="out2")
        cls.out_other_account = OrgUnitType.objects.create(name="out_other_account")

        cls.out.projects.add(cls.project)
        cls.out_2.projects.add(cls.project)
        cls.out_other_account.projects.add(cls.project_other_account)

        # forms
        cls.form_1 = Form.objects.create(name="form_1")
        cls.form_2 = Form.objects.create(name="form_2")
        cls.form_3 = Form.objects.create(name="form_3")
        cls.form_4 = Form.objects.create(name="form_4")
        cls.form_5 = Form.objects.create(name="form_5")

        cls.form_1.projects.add(cls.project)
        cls.form_2.projects.add(cls.project)
        cls.form_3.projects.add(cls.project)
        cls.form_4.projects.add(cls.project)
        cls.form_5.projects.add(cls.project)

        cls.form_6 = Form.objects.create(name="form_6")
        cls.form_7 = Form.objects.create(name="form_7")

        cls.form_6.projects.add(cls.project_other_account)
        cls.form_7.projects.add(cls.project_other_account)

        # missions
        cls.mission_form_1 = MissionForm.objects.create(name="mission_form_1", account=cls.account)
        cls.mission_form_2 = MissionForm.objects.create(name="mission_form_2", account=cls.account)
        cls.mission_form_3 = MissionForm.objects.create(name="mission_form_3", account=cls.other_account)

        MissionFormThroughForm.objects.bulk_create(
            [
                MissionFormThroughForm(
                    mission_form=cls.mission_form_1, form=cls.form_1, min_cardinality=1, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_form_1, form=cls.form_2, min_cardinality=2, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_form_1, form=cls.form_3, min_cardinality=3, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_form_2, form=cls.form_4, min_cardinality=4, max_cardinality=5
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_form_2, form=cls.form_5, min_cardinality=5, max_cardinality=6
                ),
            ]
        )

        cls.mission_out_1 = MissionOrgUnitType.objects.create(
            name="mission_out_1", account=cls.account, org_unit_type=cls.out, min_cardinality=1, max_cardinality=3
        )
        cls.mission_out_2 = MissionOrgUnitType.objects.create(
            name="mission_out_2", account=cls.account, org_unit_type=cls.out_2, min_cardinality=2, max_cardinality=4
        )
        cls.mission_out_3 = MissionOrgUnitType.objects.create(
            name="mission_out_3", account=cls.other_account, org_unit_type=cls.out_other_account
        )

        MissionFormThroughForm.objects.bulk_create(
            [
                MissionFormThroughForm(
                    mission_form=cls.mission_out_1, form=cls.form_1, min_cardinality=1, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_out_1, form=cls.form_2, min_cardinality=2, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_out_2, form=cls.form_3, min_cardinality=3, max_cardinality=3
                ),
            ]
        )

        cls.mission_et_1 = MissionEntityType.objects.create(
            name="mission_et_1", account=cls.account, entity_type=cls.et, min_cardinality=1, max_cardinality=3
        )
        cls.mission_et_2 = MissionEntityType.objects.create(
            name="mission_et_2", account=cls.account, entity_type=cls.et_2, min_cardinality=2, max_cardinality=3
        )
        cls.mission_et_3 = MissionEntityType.objects.create(
            name="mission_et_3",
            account=cls.other_account,
            entity_type=cls.et_other_account,
            min_cardinality=3,
            max_cardinality=3,
        )

        MissionFormThroughForm.objects.bulk_create(
            [
                MissionFormThroughForm(
                    mission_form=cls.mission_et_1, form=cls.form_1, min_cardinality=1, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_et_1, form=cls.form_2, min_cardinality=2, max_cardinality=3
                ),
                MissionFormThroughForm(
                    mission_form=cls.mission_et_2, form=cls.form_3, min_cardinality=3, max_cardinality=3
                ),
            ]
        )

        # deleted missions
        cls.soft_deleted_mission = MissionForm.objects.create(name="soft_deleted_mission_form", account=cls.account)
        cls.soft_deleted_mission.delete()

    def assertValidData(self, data):
        self.assertResponseCompliantToSwagger(data, "MissionPolymorphicRetrieve")
