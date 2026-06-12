from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status

from iaso.models import MONTH, Account, DataSource, Form, OrgUnit, OrgUnitType, Project, SourceVersion
from iaso.permissions.core_permissions import CORE_FORMS_PERMISSION, CORE_ORG_UNITS_TYPES_PERMISSION
from iaso.test import APITestCase


class OrgUnitTypesV2DestroyTestCase(APITestCase):
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

        cls.jon = cls.create_user_with_profile(
            username="jon",
            account=ghi,
            permissions=[CORE_FORMS_PERMISSION],
        )

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
        res = self.client.delete(reverse("orgunittypes_v2-detail", kwargs={"pk": self.org_unit_type_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        self.client.force_authenticate(self.normal_user)
        res = self.client.delete(reverse("orgunittypes_v2-detail", kwargs={"pk": self.org_unit_type_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.jon)
        res = self.client.delete(reverse("orgunittypes_v2-detail", kwargs={"pk": self.org_unit_type_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.jane)
        res = self.client.delete(reverse("orgunittypes_v2-detail", kwargs={"pk": self.org_unit_type_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_cannot_destroy_if_ou_linked_to_it(self):
        ou = OrgUnit.objects.create(name="Org Unit")
        self.org_unit_type_2.org_units.add(ou)
        self.client.force_authenticate(self.jane)

        res = self.client.delete(reverse("orgunittypes_v2-detail", kwargs={"pk": self.org_unit_type_2.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_400_BAD_REQUEST)

        self.assertEqual(res_data, ["You can't delete a type that still has org units"])

    def test_cannot_destroy_orgunit_type_not_belonging_to_user(self):
        self.client.force_authenticate(self.jane)
        pk = self.org_unit_type_6.pk

        res = self.client.delete(reverse("orgunittypes_v2-detail", kwargs={"pk": self.org_unit_type_6.pk}))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

        self.assertTrue(OrgUnitType.objects.filter(id=pk).exists())

    def test_destroy(self):
        self.client.force_authenticate(self.jane)
        pk = self.org_unit_type_1.pk

        res = self.client.delete(reverse("orgunittypes_v2-detail", kwargs={"pk": self.org_unit_type_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(OrgUnitType.objects.filter(id=pk).exists())

    def test_num_queries(self):
        self.client.force_authenticate(self.jane)
        pk = self.org_unit_type_1.pk

        with self.assertNumQueries(20):
            res = self.client.delete(reverse("orgunittypes_v2-detail", kwargs={"pk": self.org_unit_type_1.pk}))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.assertFalse(OrgUnitType.objects.filter(id=pk).exists())
