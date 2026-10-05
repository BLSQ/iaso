from iaso.tests.api.v3.org_units.base import BASE_URL, OrgUnitV3TestCase


class OrgUnitV3PermissionsTestCase(OrgUnitV3TestCase):
    def test_anonymous_user_is_rejected(self):
        self.client.force_authenticate(None)
        self.get_error({}, status_code=401)

    def test_anonymous_user_is_rejected_on_retrieve(self):
        self.client.force_authenticate(None)
        self.get_error({}, status_code=401, url=f"{BASE_URL}{self.region.id}/")

    def test_user_sees_only_their_own_account(self):
        self.assertCountEqual(self.get_ids(), [org_unit.id for org_unit in self.star_wars_org_units])

    def test_user_from_another_account_sees_only_their_own_account(self):
        self.client.force_authenticate(self.other_account_user)
        self.assertCountEqual(self.get_ids(), [self.marvel_org_unit.id, self.marvel_org_unit_without_geom.id])

    def test_retrieve_of_another_accounts_org_unit_is_not_found(self):
        self.get_error({}, status_code=404, url=f"{BASE_URL}{self.marvel_org_unit.id}/")

    # A filter referencing an org unit of another account must answer exactly like one referencing an org unit
    # that doesn't exist - otherwise the response leaks that the id exists (and, for the spatial ones, uses
    # the other account's geometry as the reference shape).

    def test_filters_referencing_another_accounts_org_unit_behave_as_if_it_did_not_exist(self):
        cases = {
            "location__within_org_unit": self.marvel_org_unit,  # has a geom
            "location__outside_org_unit": self.marvel_org_unit_without_geom,  # would say "has no geometry"
            "ancestor_id": self.marvel_org_unit,
        }
        for param, foreign_org_unit in cases.items():
            with self.subTest(param=param):
                foreign = self.get_error({param: foreign_org_unit.id})
                nonexistent = self.get_error({param: 999999999})
                self.assertEqual(foreign["error"], f"Org unit {foreign_org_unit.id} does not exist")
                self.assertEqual(nonexistent["error"], "Org unit 999999999 does not exist")
