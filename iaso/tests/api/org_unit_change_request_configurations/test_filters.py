from iaso import models as m
from iaso.tests.api.org_unit_change_request_configurations.common_base_with_setup import OUCRCAPIBase


class FilterOrgUnitChangeRequestAPITestCase(OUCRCAPIBase):
    """
    Test OrgUnitChangeRequestConfigurationListFilter on the OrgUnitChangeRequestConfigurationViewSet.
    """

    def create_new_project_and_new_oucrc(self, org_unit_type, creator):
        # Prepare new project
        new_project = m.Project.objects.create(name="New Project", account=self.account_pokemon)
        new_oucrc = m.OrgUnitChangeRequestConfiguration.objects.create(
            org_unit_type=org_unit_type,
            project=new_project,
            type=m.OrgUnitChangeRequestConfiguration.Type.EDITION,
            created_by=creator,
            org_units_editable=False,
        )
        return new_project, new_oucrc

    def test_filter_config_on_project_id(self):
        # Prepare new project
        new_project, new_oucrc = self.create_new_project_and_new_oucrc(
            self.ou_type_fire_pokemons, self.user_ash_ketchum
        )

        self.client.force_authenticate(self.user_ash_ketchum)

        # Filtering on the new project
        response = self.client.get(f"{self.OUCRC_API_URL}?project_id={new_project.id}")
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual(1, len(result))
        self.assertEqual(result[0]["id"], new_oucrc.id)

        # Filtering on a project with multiple OUCRCs
        response = self.client.get(f"{self.OUCRC_API_URL}?project_id={self.project_johto.id}")
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual(6, len(result))  # The 6 OUCRCs created in setup

        # Making sure that the 6 results do not include the new OUCRC
        oucrc_ids = []
        for oucrc in result:
            oucrc_ids.append(oucrc["id"])
        self.assertNotIn(new_oucrc.id, oucrc_ids)

        # Filtering on unknown project
        probably_not_a_valid_id = 1234567890
        response = self.client.get(f"{self.OUCRC_API_URL}?project_id={probably_not_a_valid_id}")
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual([], result)

    def test_filter_config_on_org_unit_type_id(self):
        new_project, new_oucrc = self.create_new_project_and_new_oucrc(self.ou_type_water_pokemons, self.user_misty)

        self.client.force_authenticate(self.user_misty)

        # Filtering on an orgunit type with OUCRCs in multiple projects
        response = self.client.get(f"{self.OUCRC_API_URL}?org_unit_type_id={self.ou_type_water_pokemons.id}")
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual(3, len(result))
        # Results should be ordered by ID by default, so the new one will always be last
        self.assertEqual(result[0]["id"], self.oucrc_type_water.id)
        self.assertEqual(result[1]["id"], self.oucrc_type_water_creation.id)
        self.assertEqual(result[2]["id"], new_oucrc.id)

        response = self.client.get(f"{self.OUCRC_API_URL}?org_unit_type_id={self.ou_type_rock_pokemons.id}")
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual(2, len(result))
        self.assertEqual(result[0]["id"], self.oucrc_type_rock.id)
        self.assertEqual(result[1]["id"], self.oucrc_type_rock_creation.id)

        # Filtering on unknown orgunit type
        probably_not_a_valid_id = 1234567890
        response = self.client.get(f"{self.OUCRC_API_URL}?org_unit_type_id={probably_not_a_valid_id}")
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual([], result)

    def test_filter_config_on_created_by(self):
        new_project, new_oucrc = self.create_new_project_and_new_oucrc(self.ou_type_rock_pokemons, self.user_brock)

        self.client.force_authenticate(self.user_misty)

        # Filtering on a single user, with OUCRCs in multiple projects
        response = self.client.get(f"{self.OUCRC_API_URL}?created_by={self.user_brock.id}")
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual(3, len(result))
        # Results should be ordered by ID by default, so the new one will always be last
        self.assertEqual(result[0]["id"], self.oucrc_type_rock.id)
        self.assertEqual(result[1]["id"], self.oucrc_type_rock_creation.id)
        self.assertEqual(result[2]["id"], new_oucrc.id)

        # Filtering on multiple users
        response = self.client.get(f"{self.OUCRC_API_URL}?created_by={self.user_brock.id},{self.user_ash_ketchum.id}")
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual(5, len(result))
        self.assertEqual(result[0]["id"], self.oucrc_type_fire.id)
        self.assertEqual(result[0]["created_by"]["username"], self.user_ash_ketchum.username)
        self.assertEqual(result[1]["id"], self.oucrc_type_fire_creation.id)
        self.assertEqual(result[1]["created_by"]["username"], self.user_ash_ketchum.username)
        self.assertEqual(result[2]["id"], self.oucrc_type_rock.id)
        self.assertEqual(result[2]["created_by"]["username"], self.user_brock.username)
        self.assertEqual(result[3]["id"], self.oucrc_type_rock_creation.id)
        self.assertEqual(result[3]["created_by"]["username"], self.user_brock.username)
        self.assertEqual(result[4]["id"], new_oucrc.id)
        self.assertEqual(result[4]["created_by"]["username"], self.user_brock.username)

        # Filtering on unknown user
        probably_not_a_valid_id = 1234567890
        response = self.client.get(f"{self.OUCRC_API_URL}?created_by={probably_not_a_valid_id}")
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual([], result)

    def filter_config_on_multiple_criteria(self):
        new_project_1, new_oucrc_1 = self.create_new_project_and_new_oucrc(
            self.ou_type_fire_pokemons, self.user_ash_ketchum
        )
        new_project_2, new_oucrc_2 = self.create_new_project_and_new_oucrc(
            self.ou_type_water_pokemons, self.user_ash_ketchum
        )
        new_project_3, new_oucrc_3 = self.create_new_project_and_new_oucrc(
            self.ou_type_rock_pokemons, self.user_ash_ketchum
        )

        self.client.force_authenticate(self.user_ash_ketchum)

        # Filtering on a project and type -> combination is ok (result can never be more than 1)
        response = self.client.get(
            f"{self.OUCRC_API_URL}?project_id={new_project_1.id}&org_unit_type_id={self.ou_type_fire_pokemons.id}"
        )
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual(1, len(result))
        self.assertEqual(result[0]["id"], new_oucrc_1.id)

        # Filtering on a project and type -> no result
        new_type = m.OrgUnitType.objects.create(name="New Type")
        response = self.client.get(f"{self.OUCRC_API_URL}?project_id={new_project_3.id}&org_unit_type_id={new_type.id}")
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual(0, len(result))

        # Filtering on a project and a creator -> combination is ok
        response = self.client.get(
            f"{self.OUCRC_API_URL}?project_id={new_project_1.id}&created_by={self.user_ash_ketchum.id}"
        )
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual(1, len(result))
        self.assertEqual(result[0]["id"], new_oucrc_1.id)

        # Filtering on a project and a creator -> no result
        response = self.client.get(
            f"{self.OUCRC_API_URL}?project_id={new_project_2.id}&created_by={self.user_misty.id}"
        )
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual(0, len(result))

        # Filtering on an orgunit type and a creator -> combination is ok
        response = self.client.get(
            f"{self.OUCRC_API_URL}?org_unit_type_id={self.ou_type_fire_pokemons.id}&created_by={self.user_ash_ketchum.id}"
        )
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual(2, len(result))
        self.assertEqual(result[0]["id"], self.oucrc_type_fire.id)
        self.assertEqual(result[1]["id"], new_oucrc_1.id)

        # Filtering on an orgunit type and a creator -> no result
        response = self.client.get(
            f"{self.OUCRC_API_URL}?org_unit_type_id={self.ou_type_rock_pokemons.id}&created_by={self.user_misty.id}"
        )
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual(0, len(result))

        # Filtering on everything -> combination is ok
        response = self.client.get(
            f"{self.OUCRC_API_URL}?project_id={new_project_3.id}&org_unit_type_id={self.ou_type_rock_pokemons.id}&created_by={self.user_ash_ketchum.id}"
        )
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual(1, len(result))
        self.assertEqual(result[0]["id"], new_oucrc_3.id)

        # Filtering on everything -> no result
        response = self.client.get(
            f"{self.OUCRC_API_URL}?project_id={new_project_3.id}&org_unit_type_id={self.ou_type_rock_pokemons.id}&created_by={self.user_brock.id}"
        )
        self.assertJSONResponse(response, 200)
        result = response.json()["results"]
        self.assertEqual(0, len(result))
