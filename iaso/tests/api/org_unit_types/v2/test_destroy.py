from iaso.models import Account
from iaso.test import APITestCase


class OrgUnitTypesV2DestroyTestCase(APITestCase):
    @classmethod
    def setUpTestData(cls):
        super().setUpTestData()
        cls.account = Account.objects.create(name="account")
        cls.other_account = Account.objects.create(name="other account")
        cls.ead = ead = m.Project.objects.create(name="End All Diseases", account=cls.account)
        cls.esd = ead = m.Project.objects.create(name="End Some diseases", account=cls.other_account)
        cls.org_unit_type_1 = org_unit_type_1 = m.OrgUnitType.objects.create(name="Plop", short_name="Pl")
        ead.unit_types.add(org_unit_type_1)

    def test_permissions(self):
        self.fail()

    def test_cannot_destroy_orgunit_type_not_belonging_to_user(self):
        self.fail()

    def test_destroy(self):
        self.client.force_authenticate(self.jane)
        response = self.client.delete(f"{self.BASE_URL}{self.org_unit_type_1.id}/", format="json")
        self.assertJSONResponse(response, 204)

    def test_num_queries(self):
        pass
