from iaso.models import Account, Form, OrgUnitType, OrgUnit
from iaso.test import APITestCase
from django.contrib.auth.models import User, Permission


class CompletenessStatsAPITestCase(APITestCase):
    fixtures = ["user.yaml", "orgunit.yaml"]
    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.get(username="test")
        cls.user.user_permissions.add(Permission.objects.get(codename="iaso_completeness_stats"))
        cls.account = Account.objects.get(name="test")

        # Another user that doesn't have the permission for this feature
        cls.user_without_permission = cls.create_user_with_profile(username="yoda2", account=cls.account)

        # We create two forms for the user (we also need a project to create the association)
        cls.form_hs_1 = Form.objects.create(name="Hydroponics study 1")
        cls.form_hs_2 = Form.objects.create(name="Hydroponics study 2")

        # This one won't appear because we don't associate it to the user (via project)
        cls.form_hs_3 = Form.objects.create(name="Hydroponics study 3")
        cls.form_hs_4 = Form.objects.create(name="Hydroponics study 4")

        cls.project_1 = cls.account.project_set.first()
        cls.project_1.forms.add(cls.form_hs_1)
        cls.project_1.forms.add(cls.form_hs_2)
        cls.project_1.forms.add(cls.form_hs_4)
        cls.project_1.save()
        cls.org_unit_type_hopital = OrgUnitType.objects.get(pk=5)
        cls.org_unit_type_aire_sante = OrgUnitType.objects.get(pk=4)
        cls.org_unit_type_district = OrgUnitType.objects.get(pk=3)
        cls.form_hs_1.org_unit_types.add(cls.org_unit_type_district)
        cls.form_hs_1.org_unit_types.add(cls.org_unit_type_hopital)
        cls.form_hs_2.org_unit_types.add(cls.org_unit_type_hopital)
        cls.form_hs_3.org_unit_types.add(cls.org_unit_type_aire_sante)
        cls.form_hs_4.org_unit_types.add(cls.org_unit_type_aire_sante)
        cls.hopital_aaa_ou = OrgUnit.objects.filter(org_unit_type=cls.org_unit_type_hopital).first()
        cls.create_form_instance(form=cls.form_hs_1, org_unit=cls.hopital_aaa_ou)

    def test_row_listing_anonymous(self):
        """An anonymous user should not be able to access the API"""
        response = self.client.get("/api/completeness_stats/")
        self.assertEqual(response.status_code, 403)

    def test_row_listing_insufficient_permissions(self):
        """A user without the permission should not be able to access the API"""
        self.client.force_authenticate(self.user_without_permission)

        response = self.client.get("/api/completeness_stats/")
        self.assertEqual(response.status_code, 403)

    def test_base_row_listing(self):
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/completeness_stats/")
        j = self.assertJSONResponse(response, 200)
        self.assertDictEqual(
            {
                "count": 3,
                "results": [
                    {
                        "parent_org_unit": None,
                        "org_unit_type": {"name": "Country", "id": 1},
                        "org_unit": {"name": "LaLaland", "id": 1},
                        "form": {"name": "Hydroponics study 1", "id": self.form_hs_1.id},
                        # "Hydroponics study 1" applies to OUt "District" and "Hospital"
                        "forms_filled": 1,  # Only one form instance for "Hospital"
                        "forms_to_fill": 3,  # 2 OUs of type "District" and 1 of type "Hospital" in the tree with LalaLand on top
                        "completeness_ratio": "33.3%",
                        # No forms/instances are directly associated to "LaLaland" (only to its children)
                        "forms_filled_strict": 0,
                        "forms_to_fill_strict": 0,
                        "completeness_ratio_strict": "N/A",
                    },
                    {
                        "parent_org_unit": None,
                        "org_unit_type": {"name": "Country", "id": 1},
                        "org_unit": {"name": "LaLaland", "id": 1},
                        "form": {"name": "Hydroponics study 2", "id": self.form_hs_2.id},
                        "forms_filled": 0,
                        "forms_to_fill": 1,
                        "completeness_ratio": "0.0%",
                        "forms_filled_strict": 0,
                        "forms_to_fill_strict": 0,
                        "completeness_ratio_strict": "N/A",
                    },
                    {
                        "parent_org_unit": None,
                        "org_unit_type": {"name": "Country", "id": 1},
                        "org_unit": {"name": "LaLaland", "id": 1},
                        "form": {"name": "Hydroponics study 4", "id": self.form_hs_4.id},
                        "forms_filled": 0,
                        "forms_to_fill": 2,
                        "completeness_ratio": "0.0%",
                        "forms_filled_strict": 0,
                        "forms_to_fill_strict": 0,
                        "completeness_ratio_strict": "N/A",
                    },
                ],
                "has_next": False,
                "has_previous": False,
                "page": 1,
                "pages": 1,
                "limit": 50,
            },
            j,
        )

    def test_no_filters_only_heads(self):
        """No filters are used: only the heads OU (countries) are returned"""
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/completeness_stats/")
        json = response.json()
        for result in json["results"]:
            # There are lower-levels OUs in fixtures, but they shouldn't appear here
            self.assertIsNone(result["parent_org_unit"])

    def test_filter_by_form_type(self):
        """Filtering by form type"""
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/completeness_stats/?form_id={self.form_hs_1.id}")
        json = response.json()
        # Without filtering, we would also have results for form_hs_2 and form_hs_4 just like in test_base_row_listing()
        for result in json["results"]:
            self.assertEqual(result["form"]["id"], self.form_hs_1.id)

    def test_filter_by_multiple_form_types(self):
        """Filtering by multiple form types"""
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/completeness_stats/?form_id={self.form_hs_1.id}, {self.form_hs_4.id}")
        json = response.json()
        # Without filtering, we would also have results for form_hs_2 just like in test_base_row_listing()
        for result in json["results"]:
            form_id_result = result["form"]["id"]
            self.assertIn(form_id_result, [self.form_hs_1.id, self.form_hs_4.id])

    def test_only_forms_from_account(self):
        """Only forms from the account are returned"""
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/completeness_stats/?form_id={self.form_hs_3.id}")
        json = response.json()
        # No results because the form is not in the user's account
        self.assertEqual(json["count"], 0)

    def test_only_valid_ou_returned(self):
        """OUs with a non-valid status are excluded from the API"""
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/completeness_stats/")
        json = response.json()
        ou_ids = [result["org_unit"]["id"] for result in json["results"]]
        # Those two OUs have a non-valid status
        self.assertNotIn(8, ou_ids)
        self.assertNotIn(9, ou_ids)

    def test_filter_by_org_unit_type(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/completeness_stats/?org_unit_type_id={self.org_unit_type_hopital.id}")
        json = response.json()
        for result in json["results"]:
            self.assertEqual(result["org_unit_type"]["id"], self.org_unit_type_hopital.id)

    def test_filter_by_multiple_org_unit_types(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(
            f"/api/completeness_stats/?org_unit_type_id={self.org_unit_type_hopital.id}, {self.org_unit_type_aire_sante.id}"
        )
        json = response.json()
        for result in json["results"]:
            self.assertIn(
                result["org_unit_type"]["id"], [self.org_unit_type_hopital.id, self.org_unit_type_aire_sante.id]
            )

    def test_filter_by_org_unit(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/completeness_stats/?org_unit_id=7")
        json = response.json()
        # We have only rows concerning the requested OU
        for result in json["results"]:
            self.assertEqual(result["org_unit"]["id"], 7)

    def test_pagination(self):
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/completeness_stats/?page=1&limit=1")
        j = self.assertJSONResponse(response, 200)
        self.assertEqual(j["count"], 3)
        self.assertEqual(j["page"], 1)
        self.assertEqual(j["pages"], 3)
        self.assertEqual(j["limit"], 1)
        self.assertEqual(len(j["results"]), 1)
        self.assertTrue(j["has_next"])
        self.assertFalse(j["has_previous"])

    def test_row_count(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/completeness_stats/")
        json = response.json()
        # One OU, 3 forms => 3 rows
        self.assertEqual(len(json["results"]), 3)

    def test_percentage_calculation_with_zero_forms_to_fill(self):
        self.client.force_authenticate(self.user)

        # We request a form/OU combination that has no forms to fill.
        response = self.client.get(f"/api/completeness_stats/?org_unit_id=3&form_id={self.form_hs_2.id}")
        json = response.json()
        # 0 forms to fill: the percentage should be returned as N/A and not as 0% or as a division error :)
        row = json["results"][0]
        self.assertEqual(row["forms_to_fill"], 0)
        self.assertEqual(row["completeness_ratio"], "N/A")

    def test_counts_include_current_ou_and_children(self):
        """The forms_to_fill/forms_filled counts include the forms for the OU and all its children"""
        self.client.force_authenticate(self.user)

        # We filter to get only the district A.A
        response = self.client.get(f"/api/completeness_stats/?org_unit_id=4")
        json = response.json()

        result_form_1 = next(result for result in json["results"] if result["form"]["id"] == self.form_hs_1.id)
        # Form 1 targets both district (ou 4) and hospital (there's one under ou 4: ou 7), so 2 forms to fill
        self.assertEqual(result_form_1["forms_to_fill"], 2)
        # But only one form is filled (for the hospital)
        self.assertEqual(result_form_1["forms_filled"], 1)
        # Let's check the percentage calculation is correct
        self.assertEqual(result_form_1["completeness_ratio"], "50.0%")

    def test_strict_counts_dont_include_children(self):
        """The forms_to_fill_strict/forms_filled_strict counts don't include the forms for the children of the OU"""
        self.client.force_authenticate(self.user)

        # We filter to get only the district A.A
        response = self.client.get(f"/api/completeness_stats/?org_unit_id=4")
        json = response.json()

        result_form_1 = next(result for result in json["results"] if result["form"]["id"] == self.form_hs_1.id)

        # Form 1 targets both district (ou 4) and hospital (there's one under ou 4: ou 7), but the
        # hospital shouldn't be counted in the strict counts
        self.assertEqual(result_form_1["forms_to_fill_strict"], 1)
        # But only one form is filled (for the hospital), so it shouldn't be counted in the strict counts
        self.assertEqual(result_form_1["forms_filled_strict"], 0)
        # Let's check the percentage calculation is correct
        self.assertEqual(result_form_1["completeness_ratio_strict"], "0.0%")

    def test_counts_dont_include_parents(self):
        self.client.force_authenticate(self.user)
        # We have the same situation as in test_counts_include_current_ou_and_children(), except that we filter to only
        # get the hospital (ou 7). Therefore, the form_to_fill count doens't include the form for the district (ou 4)
        # because it's a parent of the hospital (ou 7), and the count is 1/1
        response = self.client.get(f"/api/completeness_stats/?org_unit_id=7")
        json = response.json()

        result_form_1 = next(result for result in json["results"] if result["form"]["id"] == self.form_hs_1.id)
        # Form 1 targets both district (ou 4) and hospital (there's one under ou 4: ou 7), so 2 forms to fill
        self.assertEqual(result_form_1["forms_to_fill"], 1)
        # But only one form is filled (for the hospital)
        self.assertEqual(result_form_1["forms_filled"], 1)
        # Let's check the percentage calculation is correct
        self.assertEqual(result_form_1["completeness_ratio"], "100.0%")
