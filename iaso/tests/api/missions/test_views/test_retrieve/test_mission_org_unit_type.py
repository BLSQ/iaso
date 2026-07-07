from django.urls import reverse
from rest_framework import status

from iaso.models.missions import MissionType
from iaso.tests.api.missions.test_views.test_retrieve.base import MissionAPIRetrieveBaseTestCase


class MissionAPIRetrieveMissionOrgUnitTypeTestCase(MissionAPIRetrieveBaseTestCase):
    def test_num_queries(self):
        self.client.force_authenticate(self.user_account_read_perm)

        with self.assertNumQueries(5):
            res = self.client.get(reverse("missions-detail", kwargs={"pk": self.mission_out_1.pk}))

        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)
        self.assertValidData(res_data)

    def test_retrieve_mission(self):
        self.client.force_authenticate(self.user_account_read_perm)
        res = self.client.get(reverse("missions-detail", kwargs={"pk": self.mission_out_1.pk}))
        res_data = self.assertJSONResponse(res, status.HTTP_200_OK)

        self.assertEqual(res_data["id"], self.mission_out_1.pk)
        self.assertEqual(res_data["name"], "mission_out_1")
        self.assertEqual(res_data["mission_type"], MissionType.ORG_UNIT_AND_FORM.label)
        self.assertEqual(res_data["min_cardinality"], 1)
        self.assertEqual(res_data["max_cardinality"], 3)
        self.assertEqual(
            res_data["org_unit_type"],
            {
                "id": self.out.pk,
                "name": "out",
            },
        )
        self.assertIsNotNone(res_data["created_at"])
        self.assertEqual(
            res_data["forms"],
            [
                {"form": self.form_1.pk, "form_name": "form_1", "min_cardinality": 1, "max_cardinality": 3},
                {"form": self.form_2.pk, "form_name": "form_2", "min_cardinality": 2, "max_cardinality": 3},
            ],
        )
