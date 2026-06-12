from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from iaso.models import MONTH, Account, DataSource, Form, OrgUnitType, Project, SourceVersion
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_ORG_UNITS_TYPES_PERMISSION
from iaso.test import APITestCase, SwaggerTestCaseMixin


class OrgUnitTypesV2RetrieveTestCase(APITestCase, SwaggerTestCaseMixin):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.data_source_1 = data_source_1 = DataSource.objects.create(name="DataSource1")
        cls.version_1 = SourceVersion.objects.create(number=1, data_source=data_source_1)
        ghi = Account.objects.create(name="Global Health Initiative", default_version=cls.version_1)
        cls.ead = ead = Project.objects.create(name="End All Diseases", account=ghi, app_id="ead.app_id")
        cls.esd = esd = Project.objects.create(name="End Some Diseases", account=ghi, app_id="esd.app_id")
        cls.data_source_2 = data_source_2 = DataSource.objects.create(name="DataSource2")
        cls.version_2 = SourceVersion.objects.create(number=1, data_source=data_source_2)

        wha = Account.objects.create(name="Worldwide Health Aid", default_version=cls.version_2)
        cls.wrong_project = wrong_project = Project.objects.create(name="End No Diseases", account=wha)

        cls.normal_user = get_user_model().objects.create_user(username="normal", password="normal")

        cls.jane = cls.create_user_with_profile(
            username="janedoe",
            account=ghi,
            permissions=[CORE_FORMS_PERMISSION, CORE_ORG_UNITS_TYPES_PERMISSION],
        )
        cls.reference_form = reference_form = Form.objects.create(
            name="Hydroponics study", period_type=MONTH, single_per_period=True
        )
        cls.reference_form_update = reference_form_update = Form.objects.create(
            name="Reference form update", period_type=MONTH, single_per_period=True
        )
        cls.reference_form_wrong_project = reference_form_wrong_project = Form.objects.create(
            name="Reference form with wrong project", period_type=MONTH, single_per_period=True
        )
        cls.org_unit_type_1 = org_unit_type_1 = OrgUnitType.objects.create(name="Plop", short_name="Pl")
        cls.org_unit_type_1.reference_forms.add(cls.reference_form_update)
        cls.org_unit_type_1.save()
        cls.org_unit_type_2 = org_unit_type_2 = OrgUnitType.objects.create(name="Boom", short_name="Bo")
        ead.unit_types.set([org_unit_type_1, org_unit_type_2])

        ead.forms.add(reference_form)
        ead.forms.add(reference_form_update)
        ead.save()

        cls.org_unit_type_3 = org_unit_type_3 = OrgUnitType.objects.create(name="3", short_name="3")
        cls.org_unit_type_4 = org_unit_type_4 = OrgUnitType.objects.create(name="4", short_name="4")
        cls.org_unit_type_5 = org_unit_type_5 = OrgUnitType.objects.create(name="5", short_name="5")
        esd.unit_types.set([org_unit_type_3, org_unit_type_4, org_unit_type_5])
        esd.save()

        cls.org_unit_type_3.sub_unit_types.add(cls.org_unit_type_4)
        cls.org_unit_type_3.sub_unit_types.add(cls.org_unit_type_5)

        cls.org_unit_type_2.sub_unit_types.add(cls.org_unit_type_2)
        cls.org_unit_type_2.sub_unit_types.add(cls.org_unit_type_3)

        wrong_project.forms.add(reference_form_wrong_project)
        cls.org_unit_type_6 = org_unit_type_6 = OrgUnitType.objects.create(name="6", short_name="6")
        wrong_project.unit_types.add(org_unit_type_6)
        wrong_project.save()

    def test_permissions(self):
        res = self.client.get(reverse("orgunittypes_v2-hierarchy", kwargs={"pk": self.org_unit_type_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.normal_user)
        res = self.client.get(reverse("orgunittypes_v2-hierarchy", kwargs={"pk": self.org_unit_type_1.pk}))
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

        self.client.force_authenticate(self.jane)

        res = self.client.get(reverse("orgunittypes_v2-hierarchy", kwargs={"pk": self.org_unit_type_1.pk}))
        self.assertJSONResponse(res, status.HTTP_200_OK)

        self.client.force_authenticate(self.jane)

        res = self.client.get(reverse("orgunittypes_v2-hierarchy", kwargs={"pk": self.org_unit_type_6.pk}))
        self.assertJSONResponse(res, status.HTTP_404_NOT_FOUND)

    def assertValidData(self, res_data):
        self.assertResponseCompliantToSwagger(res_data, "OrgUnitTypeHierarchy")

    def test_num_queries(self):
        parent = OrgUnitType.objects.create(name="Parent", short_name="PARENT", depth=1)
        child1 = OrgUnitType.objects.create(name="Child 1", short_name="CHILD1", depth=2)
        child2 = OrgUnitType.objects.create(name="Child 2", short_name="CHILD2", depth=2)
        child3 = OrgUnitType.objects.create(name="Child 3", short_name="CHILD3", depth=2)

        parent.sub_unit_types.set([child1, child2, child3])
        parent.projects.set([self.ead])
        child1.projects.set([self.ead])
        child2.projects.set([self.ead])
        child3.projects.set([self.ead])

        self.client.force_authenticate(self.jane)

        with self.assertNumQueries(5):
            # hard to optimize as the more levels there will be, the more queries there will be as well
            response = self.client.get(reverse("orgunittypes_v2-hierarchy", kwargs={"pk": parent.id}))

        res_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidData(res_data)

    def test_org_unit_type_hierarchy_not_found(self):
        """Test GET /orgunittypes/{id}/hierarchy/ with non-existent ID returns 404"""

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("orgunittypes_v2-hierarchy", kwargs={"pk": 999999}))

        self.assertJSONResponse(response, status.HTTP_404_NOT_FOUND)

    def test_org_unit_type_hierarchy_without_auth(self):
        """Test GET /orgunittypes/{id}/hierarchy/ without authentication"""

        response = self.client.get(reverse("orgunittypes_v2-hierarchy", kwargs={"pk": self.org_unit_type_1.id}))
        # Without authentication, the queryset is filtered and returns empty, so 404 is expected
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_org_unit_type_hierarchy_multiple_children(self):
        """Test hierarchy with multiple children at same level"""

        parent = OrgUnitType.objects.create(name="Parent", short_name="PARENT", depth=1)
        child1 = OrgUnitType.objects.create(name="Child 1", short_name="CHILD1", depth=2)
        child2 = OrgUnitType.objects.create(name="Child 2", short_name="CHILD2", depth=2)
        child3 = OrgUnitType.objects.create(name="Child 3", short_name="CHILD3", depth=2)

        parent.sub_unit_types.set([child1, child2, child3])
        parent.projects.set([self.ead])
        child1.projects.set([self.ead])
        child2.projects.set([self.ead])
        child3.projects.set([self.ead])

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("orgunittypes_v2-hierarchy", kwargs={"pk": parent.id}))

        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidData(response_data)

        self.assertEqual(len(response_data["sub_unit_types"]), 3)

        child_ids = [child["id"] for child in response_data["sub_unit_types"]]
        self.assertIn(child1.id, child_ids)
        self.assertIn(child2.id, child_ids)
        self.assertIn(child3.id, child_ids)

    def test_org_unit_type_hierarchy_empty_children(self):
        """Test hierarchy with no children (leaf node)"""

        leaf = OrgUnitType.objects.create(name="Leaf Node", short_name="LEAF", depth=1)
        leaf.projects.set([self.ead])

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("orgunittypes_v2-hierarchy", kwargs={"pk": leaf.id}))

        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidData(response_data)

        self.assertEqual(len(response_data["sub_unit_types"]), 0)
        self.assertEqual(response_data["id"], leaf.id)
        self.assertEqual(response_data["name"], "Leaf Node")

    def test_org_unit_type_hierarchy_serializer_fields(self):
        """Test that hierarchy serializer returns correct fields"""

        parent = OrgUnitType.objects.create(name="Parent", short_name="PARENT", depth=1, category="COUNTRY")
        child = OrgUnitType.objects.create(name="Child", short_name="CHILD", depth=2, category="REGION")

        parent.sub_unit_types.set([child])
        parent.projects.set([self.ead])
        child.projects.set([self.ead])

        self.client.force_authenticate(self.jane)
        response = self.client.get(reverse("orgunittypes_v2-hierarchy", kwargs={"pk": parent.id}))

        response_data = self.assertJSONResponse(response, status.HTTP_200_OK)
        self.assertValidData(response_data)
        expected_fields = ["id", "name", "short_name", "depth", "category", "sub_unit_types"]
        for field in expected_fields:
            self.assertIn(field, response_data)

        child_data = response_data["sub_unit_types"][0]
        for field in expected_fields:
            self.assertIn(field, child_data)
