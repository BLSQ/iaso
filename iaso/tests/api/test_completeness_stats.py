# Those tests are not very readable in themselves because they use complex data that is set up both in fixtures files
# and in the setupTestData() methods.

# Please refer to the diagram in ../docs/test_completeness_stats.png to understand the expected results

from typing import Any

from django.contrib.auth.models import User, Permission

from iaso.models import Account, Form, OrgUnitType, OrgUnit, Instance
from iaso.test import APITestCase


def _slug(form):
    return f"form_{form.id}"


# from https://stackoverflow.com/a/54649973 redsk
def are_almost_equal(o1: Any, o2: Any, max_abs_ratio_diff: float, max_abs_diff: float) -> bool:
    """
    Compares two objects by recursively walking them through. Equality is as usual except for floats.
    Floats are compared according to the two measures defined below.

    :param o1: The first object.
    :param o2: The second object.
    :param max_abs_ratio_diff: The maximum allowed absolute value of the difference.
    `abs(1 - (o1 / o2)` and vice-versa if o2 == 0.0. Ignored if < 0.
    :param max_abs_diff: The maximum allowed absolute difference `abs(o1 - o2)`. Ignored if < 0.
    :return: Whether the two objects are almost equal.
    """
    if type(o1) != type(o2):
        return False

    composite_type_passed = False

    if hasattr(o1, "__slots__"):
        if len(o1.__slots__) != len(o2.__slots__):
            return False
        if any(
            not are_almost_equal(getattr(o1, s1), getattr(o2, s2), max_abs_ratio_diff, max_abs_diff)
            for s1, s2 in zip(sorted(o1.__slots__), sorted(o2.__slots__))
        ):
            return False
        else:
            composite_type_passed = True

    if hasattr(o1, "__dict__"):
        if len(o1.__dict__) != len(o2.__dict__):
            return False
        if any(
            not are_almost_equal(k1, k2, max_abs_ratio_diff, max_abs_diff)
            or not are_almost_equal(v1, v2, max_abs_ratio_diff, max_abs_diff)
            for ((k1, v1), (k2, v2)) in zip(sorted(o1.__dict__.items()), sorted(o2.__dict__.items()))
            if not k1.startswith("__")
        ):  # avoid infinite loops
            return False
        else:
            composite_type_passed = True

    if isinstance(o1, dict):
        if len(o1) != len(o2):
            return False
        if any(
            not are_almost_equal(k1, k2, max_abs_ratio_diff, max_abs_diff)
            or not are_almost_equal(v1, v2, max_abs_ratio_diff, max_abs_diff)
            for ((k1, v1), (k2, v2)) in zip(sorted(o1.items()), sorted(o2.items()))
        ):
            return False

    elif any(issubclass(o1.__class__, c) for c in (list, tuple, set)):
        if len(o1) != len(o2):
            return False
        if any(not are_almost_equal(v1, v2, max_abs_ratio_diff, max_abs_diff) for v1, v2 in zip(o1, o2)):
            return False

    elif isinstance(o1, float):
        if o1 == o2:
            return True
        else:
            # FIXME we can probably replace this by math.isclose
            if max_abs_ratio_diff > 0:  # if max_abs_ratio_diff < 0, max_abs_ratio_diff is ignored
                if o2 != 0:
                    if abs(1.0 - (o1 / o2)) > max_abs_ratio_diff:
                        return False
                else:  # if both == 0, we already returned True
                    if abs(1.0 - (o2 / o1)) > max_abs_ratio_diff:
                        return False
            if 0 < max_abs_diff < abs(o1 - o2):  # if max_abs_diff < 0, max_abs_diff is ignored
                return False
            return True

    else:
        if not composite_type_passed:
            return o1 == o2

    return True


class CompletenessStatsAPITestCase(APITestCase):
    fixtures = ["user.yaml", "orgunit.yaml"]
    maxDiff = None

    @classmethod
    def setUpTestData(cls):
        # Update test data here? Please also update the diagram in ../docs/test_completeness_stats.png
        # It is known as "test-completeness-stats-fixtures-illustrated" in Whimsical
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
        cls.org_unit_type_country = OrgUnitType.objects.get(pk=1)
        cls.org_unit_type_hopital = OrgUnitType.objects.get(pk=5)
        cls.org_unit_type_aire_sante = OrgUnitType.objects.get(pk=4)
        cls.org_unit_type_district = OrgUnitType.objects.get(pk=3)
        cls.form_hs_1.org_unit_types.add(cls.org_unit_type_district)
        cls.form_hs_1.org_unit_types.add(cls.org_unit_type_hopital)
        cls.form_hs_2.org_unit_types.add(cls.org_unit_type_hopital)
        cls.form_hs_3.org_unit_types.add(cls.org_unit_type_aire_sante)
        cls.form_hs_4.org_unit_types.add(cls.org_unit_type_aire_sante)
        cls.form_hs_4.org_unit_types.add(cls.org_unit_type_country)
        cls.hopital_aaa_ou = OrgUnit.objects.filter(org_unit_type=cls.org_unit_type_hopital).first()
        cls.create_form_instance(form=cls.form_hs_1, org_unit=cls.hopital_aaa_ou)

        cls.as_abb_ou = OrgUnit.objects.get(pk=10)
        cls.create_form_instance(form=cls.form_hs_4, org_unit=cls.as_abb_ou)
        cls.create_form_instance(form=cls.form_hs_4, org_unit=cls.as_abb_ou)

    def assertAlmostEqualRecursive(self, first, second, msg: Any = None) -> None:
        "to use when float are the worst"
        self.assertTrue(
            are_almost_equal(first, second, 0.000001, 0.000001),
            msg=msg,
        )

    def test_row_listing_anonymous(self):
        """An anonymous user should not be able to access the API"""
        response = self.client.get("/api/v2/completeness_stats/")
        self.assertEqual(response.status_code, 403)

    def test_row_listing_insufficient_permissions(self):
        """A user without the permission should not be able to access the API"""
        self.client.force_authenticate(self.user_without_permission)

        response = self.client.get("/api/v2/completeness_stats/")
        self.assertEqual(response.status_code, 403)

    def test_base_row_listing(self):
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/v2/completeness_stats/", {"org_unit_validation_status": "VALID,NEW"})
        j = self.assertJSONResponse(response, 200)
        expected_result = {
            "forms": [
                {"id": self.form_hs_1.id, "name": "Hydroponics study 1", "slug": f"form_{self.form_hs_1.id}"},
                {"id": self.form_hs_2.id, "name": "Hydroponics study 2", "slug": f"form_{self.form_hs_2.id}"},
                {"id": self.form_hs_4.id, "name": "Hydroponics study 4", "slug": f"form_{self.form_hs_4.id}"},
            ],
            "count": 2,
            "results": [
                {
                    "name": "LaLaland",
                    "id": 1,
                    "org_unit": {"name": "LaLaland", "id": 1},
                    "form_stats": {
                        # "Hydroponics study 1" applies to OUt "District" and "Hospital"
                        f"form_{self.form_hs_1.id}": {
                            "name": "Hydroponics study 1",
                            "percent": 33.333333333333336,
                            "descendants": 3,
                            # 2 OUs of type "District" and 1 of type "Hospital" in the tree with LalaLand on top
                            "itself_target": 0,
                            "descendants_ok": 1,
                            "total_instances": 1,  # Only one form instance for "Hospital"
                            "itself_has_instances": 0,
                            # No forms/instances are directly associated to "LaLaland" (only to its children)
                            "itself_instances_count": 0,
                        },
                        f"form_{self.form_hs_2.id}": {
                            "name": "Hydroponics study 2",
                            "percent": 0,
                            "descendants": 1,
                            "itself_target": 0,
                            "descendants_ok": 0,
                            "total_instances": 0,
                            "itself_has_instances": 0,
                            "itself_instances_count": 0,
                        },
                        f"form_{self.form_hs_4.id}": {
                            "name": "Hydroponics study 4",
                            "percent": 33.333333333333336,
                            "descendants": 3,
                            "itself_target": 1,
                            "descendants_ok": 1,
                            "total_instances": 2,
                            "itself_has_instances": 0,
                            "itself_instances_count": 0,
                        },
                    },
                    "org_unit_type": {"name": "Country", "id": 1},
                    "parent_org_unit": None,
                },
                {
                    "name": "Not yet validated country",
                    "id": 9,
                    "org_unit": {"name": "Not yet validated country", "id": 9},
                    "form_stats": {
                        f"form_{self.form_hs_1.id}": {
                            "name": "Hydroponics study 1",
                            "percent": 0,
                            "descendants": 0,
                            "itself_target": 0,
                            "descendants_ok": 0,
                            "total_instances": 0,
                            "itself_has_instances": 0,
                            "itself_instances_count": 0,
                        },
                        f"form_{self.form_hs_2.id}": {
                            "name": "Hydroponics study 2",
                            "percent": 0,
                            "descendants": 0,
                            "itself_target": 0,
                            "descendants_ok": 0,
                            "total_instances": 0,
                            "itself_has_instances": 0,
                            "itself_instances_count": 0,
                        },
                        f"form_{self.form_hs_4.id}": {
                            "name": "Hydroponics study 4",
                            "percent": 0,
                            "descendants": 0,
                            "itself_target": 1,
                            "descendants_ok": 0,
                            "total_instances": 0,
                            "itself_has_instances": 0,
                            "itself_instances_count": 0,
                        },
                    },
                    "org_unit_type": {"name": "Country", "id": 1},
                    "parent_org_unit": None,
                },
            ],
            "has_next": False,
            "has_previous": False,
            "page": 1,
            "pages": 1,
            "limit": 10,
        }
        self.assertAlmostEqualRecursive(
            expected_result,
            j,
        )

    def test_no_filters_only_heads(self):
        """No filters are used: only the heads OU (countries) are returned"""
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/v2/completeness_stats/")
        json = response.json()
        for result in json["results"]:
            # There are lower-levels OUs in fixtures, but they shouldn't appear here
            self.assertIsNone(result["parent_org_unit"])

    def test_filter_by_form_type(self):
        """Filtering by form type"""
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/v2/completeness_stats/")
        json = self.assertJSONResponse(response, 200)
        # Without filtering, we  also have results for form_hs_2 and form_hs_4 just like in test_base_row_listing()
        self.assertEqual(len(json["forms"]), 3)
        for form in json["forms"]:
            self.assertIn(form["id"], [self.form_hs_1.id, self.form_hs_2.id, self.form_hs_4.id])

        # with filtering
        response = self.client.get(f"/api/v2/completeness_stats/?form_id={self.form_hs_1.id}")
        json = self.assertJSONResponse(response, 200)
        self.assertEqual(len(json["forms"]), 1)
        for form in json["forms"]:
            self.assertEqual(form["id"], self.form_hs_1.id)

        for result in json["results"]:
            for form in result["form_stats"].values():
                self.assertEqual(form["name"], self.form_hs_1.name)

    def test_filter_by_multiple_form_types(self):
        """Filtering by multiple form types"""
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/v2/completeness_stats/?form_id={self.form_hs_1.id}, {self.form_hs_4.id}")
        json = response.json()
        self.assertEqual(len(json["forms"]), 2)
        for form in json["forms"]:
            self.assertIn(form["id"], [self.form_hs_1.id, self.form_hs_4.id])
        # Without filtering, we would also have results for form_hs_2 just like in test_base_row_listing()
        for result in json["results"]:
            for form in result["form_stats"].values():
                self.assertIn(form["name"], [self.form_hs_1.name, self.form_hs_4.name])

    def test_only_forms_from_account(self):
        """Only forms from the account are returned"""
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/v2/completeness_stats/?form_id={self.form_hs_3.id}")
        j = self.assertJSONResponse(response, 400)
        # Error because the form is not in the user's account
        self.assertIn("form_id", j)
        self.assertEqual(j["form_id"], [f'Invalid pk "{self.form_hs_3.id}" - object does not exist.'])

    def test_only_valid_ou_returned(self):
        """OUs with a non-valid status are excluded from the API"""
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/v2/completeness_stats/")
        json = response.json()
        ou_ids = [result["org_unit"]["id"] for result in json["results"]]
        # Those two OUs have a non-valid status
        self.assertNotIn(8, ou_ids)
        # for now we accept new ou but not rejected
        # self.assertNotIn(9, ou_ids)

    def test_filter_by_org_unit_type(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/v2/completeness_stats/?org_unit_type_ids={self.org_unit_type_hopital.id}")
        json = response.json()
        for result in json["results"]:
            self.assertEqual(result["org_unit_type"]["id"], self.org_unit_type_hopital.id)

    # we removed the multiple type for now
    def disabled_test_filter_by_multiple_org_unit_types(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(
            f"/api/v2/completeness_stats/?org_unit_type_id={self.org_unit_type_hopital.id}, {self.org_unit_type_aire_sante.id}"
        )
        json = response.json()
        for result in json["results"]:
            self.assertIn(
                result["org_unit_type"]["id"], [self.org_unit_type_hopital.id, self.org_unit_type_aire_sante.id]
            )

    def test_filter_by_org_unit_type_400(self):
        "Invalid orgunit type -> 400"
        # We don't specify the parent_org_unit_id filter (so we only have the root OUs - a country)
        # Then we ask to filter to only keep the hospitals: nothing at this level is a hospital => no results
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/v2/completeness_stats/?org_unit_type_ids=100000")
        j = self.assertJSONResponse(response, 400)
        self.assertIn("org_unit_type_ids", j)

    def test_filter_by_org_unit_type_with_results(self):
        # Opposite scenario compared to test_filter_by_org_unit_type_no_results()
        # We don't specify the parent_org_unit_id filter (so we only have the root OUs - a country)
        # Then we ask to filter to only keep the countries: results should be identical than without the filter
        self.client.force_authenticate(self.user)

        response_with_filter = self.client.get(
            f"/api/v2/completeness_stats/?org_unit_type_id={self.org_unit_type_country.id}",
            {"org_unit_validation_status": "VALID,NEW"},
        )

        json = self.assertJSONResponse(response_with_filter, 200)
        results_with_filter = json["results"]
        self.assertEqual(len(results_with_filter), 2)
        response_without_filter = self.client.get(
            f"/api/v2/completeness_stats/", {"org_unit_validation_status": "VALID,NEW"}
        )
        results_without_filter = self.assertJSONResponse(response_without_filter, 200)["results"]
        self.assertListEqual(results_with_filter, results_without_filter)

    def test_filter_by_parent_org_unit(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(
            f"/api/v2/completeness_stats/?parent_org_unit_id=1&org_unit_validation_status=VALID,NEW"
        )
        json = response.json()
        # All the rows we get are direct children of the Country (region A and B)
        self.assertEqual(len(json["results"]), 3)

        for result in json["results"]:
            if result.get("is_root"):
                self.assertEqual(result["org_unit"]["id"], 1)
            else:
                self.assertEqual(result["parent_org_unit"]["id"], 1)

    def test_pagination(self):
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/v2/completeness_stats/?page=1&limit=1&org_unit_validation_status=VALID,NEW")
        j = self.assertJSONResponse(response, 200)
        self.assertEqual(j["count"], 2)
        self.assertEqual(j["page"], 1)
        self.assertEqual(j["pages"], 2)
        self.assertEqual(j["limit"], 1)
        self.assertEqual(len(j["results"]), 1)
        self.assertTrue(j["has_next"])
        self.assertFalse(j["has_previous"])

    def test_pagination_default_limit(self):
        """Test that the default limit parameter is 10"""
        self.client.force_authenticate(self.user)

        response = self.client.get("/api/v2/completeness_stats/", {"org_unit_validation_status": "VALID,NEW"})
        json = self.assertJSONResponse(response, 200)
        self.assertEqual(json["limit"], 10)

    def test_row_count(self):
        self.client.force_authenticate(self.user)

        response = self.client.get(f"/api/v2/completeness_stats/", {"org_unit_validation_status": "VALID,NEW"})
        json = response.json()
        # Two OU, 3 forms => 2 rows
        self.assertEqual(len(json["results"]), 2)

    def test_percentage_calculation_with_zero_forms_to_fill(self):
        self.client.force_authenticate(self.user)

        # We request a form/OU combination that has no forms to fill.
        response = self.client.get(
            f"/api/v2/completeness_stats/", {"parent_org_unit_id": self.as_abb_ou.id, "form_id": self.form_hs_2.id}
        )
        j = self.assertJSONResponse(response, expected_status_code=200)
        json = response.json()
        self.assertEqual(len(j["results"]), 1, j)
        form_slug = f"form_{self.form_hs_2.id}"

        form_stats = json["results"][0]["form_stats"][form_slug]
        self.assertEqual(form_stats["itself_target"], 0)
        self.assertEqual(form_stats["total_instances"], 0)

    def test_counts_include_current_ou_and_children(self):
        """The forms_to_fill/forms_filled counts include the forms for the OU and all its children"""
        self.client.force_authenticate(self.user)

        # We filter to get only the district A.A
        response = self.client.get(
            f"/api/v2/completeness_stats/?parent_org_unit_id=4", {"org_unit_validation_status": "VALID,NEW"}
        )
        j = self.assertJSONResponse(response, 200)
        self.assertEqual(len(j["results"]), 2)

    def test_rejected_ous_not_counted(self):
        """Make sure that non-valid ous are not counted in the counters for OU+children. See IA-1788"""
        self.client.force_authenticate(self.user)
        # first check it's counted when it's valid
        self.create_form_instance(form=self.form_hs_4, org_unit=self.as_abb_ou)
        self.as_abb_ou.validation_status = OrgUnit.VALIDATION_NEW
        self.as_abb_ou.save()
        response = self.client.get(
            f"/api/v2/completeness_stats/",
            {
                "parent_org_unit_id": self.as_abb_ou.parent.id,
                "form_id": self.form_hs_4.id,
                "org_unit_validation_status": "VALID,NEW",
            },
        )

        j = self.assertJSONResponse(response, 200)
        self.assertEqual(len(j["results"]), 4)

        # take the root (which will be District A.B).
        form_stats = j["results"][0]["form_stats"]

        expected_before = {
            _slug(self.form_hs_4): {
                "name": "Hydroponics study 4",
                "percent": 33.333333333333336,
                "descendants": 3,
                "itself_target": 0,
                "descendants_ok": 1,
                "total_instances": 3,
                "itself_has_instances": 0,
                "itself_instances_count": 0,
            }
        }
        self.assertAlmostEqualRecursive(form_stats, expected_before)

        # Then reject the orgunit and remake the query
        self.as_abb_ou.validation_status = OrgUnit.VALIDATION_REJECTED
        self.as_abb_ou.save()

        response = self.client.get(
            f"/api/v2/completeness_stats/",
            {
                "parent_org_unit_id": self.as_abb_ou.parent.id,
                "form_id": self.form_hs_4.id,
                "org_unit_validation_status": "VALID,NEW",
            },
        )

        j = self.assertJSONResponse(response, 200)
        self.assertEqual(len(j["results"]), 3)  # Because AS A.B.B is not included since its status is rejected

        # take the root (which will be District A.B).
        form_stats = j["results"][0]["form_stats"]
        self.assertEqual(j["results"][0]["org_unit"]["name"], "District A.B")

        expected = {
            _slug(self.form_hs_4): {
                "name": "Hydroponics study 4",
                "percent": 0,
                "descendants": 2,  # one less because AS A.B.B is not included since its status is rejected
                "itself_target": 0,
                "descendants_ok": 0,
                "total_instances": 0,
                "itself_has_instances": 0,
                "itself_instances_count": 0,
            }
        }
        self.assertEqual(form_stats, expected)

    def test_without_submissions_parms(self):
        """Check that without_submissions params works"""
        self.client.force_authenticate(self.user)
        # Check number of result when it's false
        response = self.client.get(
            f"/api/v2/completeness_stats/",
            {
                "parent_org_unit_id": self.as_abb_ou.parent.id,
                "form_id": self.form_hs_4.id,
                "without_submissions": "false",
            },
        )

        j = self.assertJSONResponse(response, 200)
        self.assertEqual(len(j["results"]), 4)

        # should default to false so same number of result if params is not present
        response = self.client.get(
            f"/api/v2/completeness_stats/",
            {
                "parent_org_unit_id": self.as_abb_ou.parent.id,
                "form_id": self.form_hs_4.id,
            },
        )

        j = self.assertJSONResponse(response, 200)
        self.assertEqual(len(j["results"]), 4)

        # If we filter it should be two
        response = self.client.get(
            f"/api/v2/completeness_stats/",
            {
                "parent_org_unit_id": self.as_abb_ou.parent.id,
                "form_id": self.form_hs_4.id,
                "without_submissions": "true",
            },
        )

        j = self.assertJSONResponse(response, 200)
        self.assertEqual(len(j["results"]), 2)
        for r in j["results"]:
            # check that the result have effectly zero submission
            ou = r["org_unit"]["id"]
            self.assertEqual(Instance.objects.filter(form=self.form_hs_4, org_unit_id=ou).count(), 0)
