import json

from rest_framework import status

from iaso import models as m
from iaso.tests.api.org_unit_change_request_configurations.common_base_with_setup import OUCRCAPIBase


class MobileOrgUnitChangeRequestConfigurationAPITestCase(OUCRCAPIBase):
    """
    Test mobile OUCRCViewSet.
    """

    MOBILE_OUCRC_API_URL = "/api/mobile/orgunits/changes/configs/"

    def test_list_ok(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        with self.assertNumQueries(8):
            # get_queryset
            #   1. SELECT user_editable_org_unit_type_ids
            #   2. COUNT(*) OrgUnitChangeRequestConfiguration
            #   3. SELECT OrgUnitChangeRequestConfiguration
            #   4. PREFETCH OrgUnitChangeRequestConfiguration.possible_types
            #   5. PREFETCH OrgUnitChangeRequestConfiguration.possible_parent_types
            #   6. PREFETCH OrgUnitChangeRequestConfiguration.group_sets
            #   7. PREFETCH OrgUnitChangeRequestConfiguration.editable_reference_forms
            #   8. PREFETCH OrgUnitChangeRequestConfiguration.other_groups
            response = self.client.get(f"{self.MOBILE_OUCRC_API_URL}?app_id={self.app_id}")
            self.assertJSONResponse(response, status.HTTP_200_OK)
            self.assertEqual(3, len(response.data["results"]))  # the 3 OUCRCs from setup

    def test_list_ok_with_restricted_write_permission_for_user(self):
        # Add new Org Unit Types.
        new_org_unit_type_1 = m.OrgUnitType.objects.create(name="Hospital")
        new_org_unit_type_1.projects.add(self.project_johto)
        new_org_unit_type_2 = m.OrgUnitType.objects.create(name="Health facility")
        new_org_unit_type_2.projects.add(self.project_johto)
        new_org_unit_type_3 = m.OrgUnitType.objects.create(name="District")
        new_org_unit_type_3.projects.add(self.project_johto)
        self.assertEqual(self.project_johto.unit_types.count(), 6)

        self.user_ash_ketchum.iaso_profile.editable_org_unit_types.set(
            # Only org units of this type are now writable for this user.
            [self.ou_type_fire_pokemons, new_org_unit_type_3]
        )

        self.client.force_authenticate(self.user_ash_ketchum)

        response = self.client.get(f"{self.MOBILE_OUCRC_API_URL}?app_id={self.app_id}")
        self.assertJSONResponse(response, status.HTTP_200_OK)
        results = response.data["results"]

        # The user has write access on `new_org_unit_type_3` at his Profile level
        # and there is no existing configuration for `new_org_unit_type_3`, so this
        # Org Unit Type should not be in the response meaning the user has full
        # write perms on this type.
        new_org_unit_type_3_config = next(
            (config for config in results if config["org_unit_type_id"] == new_org_unit_type_3.pk), None
        )
        self.assertEqual(new_org_unit_type_3_config, None)

        self.assertEqual(5, len(results))  # 3 OUCRCs from setup + 2 dynamic OUCRCs.
        self.assertEqual(
            json.loads(json.dumps(response.data["results"])),
            [
                {
                    "created_at": self.oucrc_type_fire.created_at.timestamp(),
                    "editable_fields": ["name", "aliases", "location", "opening_date", "closing_date"],
                    "editable_reference_form_ids": list(
                        self.oucrc_type_fire.editable_reference_forms.values_list("id", flat=True)
                    ),
                    "group_set_ids": list(self.oucrc_type_fire.group_sets.values_list("id", flat=True)),
                    "org_unit_type_id": self.ou_type_fire_pokemons.pk,
                    "org_units_editable": True,
                    "other_group_ids": list(self.oucrc_type_fire.other_groups.values_list("id", flat=True)),
                    "possible_parent_type_ids": list(
                        self.oucrc_type_fire.possible_parent_types.values_list("id", flat=True)
                    ),
                    "possible_type_ids": list(self.oucrc_type_fire.possible_types.values_list("id", flat=True)),
                    "updated_at": self.oucrc_type_fire.updated_at.timestamp(),
                },
                {
                    "created_at": None,
                    "editable_fields": [],
                    "editable_reference_form_ids": [],
                    "group_set_ids": [],
                    "org_unit_type_id": self.ou_type_rock_pokemons.pk,
                    "org_units_editable": False,
                    "other_group_ids": [],
                    "possible_parent_type_ids": [],
                    "possible_type_ids": [],
                    "updated_at": None,
                },
                {
                    "created_at": None,
                    "editable_fields": [],
                    "editable_reference_form_ids": [],
                    "group_set_ids": [],
                    "org_unit_type_id": self.ou_type_water_pokemons.pk,
                    "org_units_editable": False,
                    "other_group_ids": [],
                    "possible_parent_type_ids": [],
                    "possible_type_ids": [],
                    "updated_at": None,
                },
                {
                    "created_at": None,
                    "editable_fields": [],
                    "editable_reference_form_ids": [],
                    "group_set_ids": [],
                    "org_unit_type_id": new_org_unit_type_1.id,
                    "org_units_editable": False,
                    "other_group_ids": [],
                    "possible_parent_type_ids": [],
                    "possible_type_ids": [],
                    "updated_at": None,
                },
                {
                    "created_at": None,
                    "editable_fields": [],
                    "editable_reference_form_ids": [],
                    "group_set_ids": [],
                    "org_unit_type_id": new_org_unit_type_2.id,
                    "org_units_editable": False,
                    "other_group_ids": [],
                    "possible_parent_type_ids": [],
                    "possible_type_ids": [],
                    "updated_at": None,
                },
            ],
        )

    def test_list_without_auth(self):
        response = self.client.get(f"{self.MOBILE_OUCRC_API_URL}?app_id={self.app_id}")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_list_error_missing_app_id(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        response = self.client.get(f"{self.MOBILE_OUCRC_API_URL}")
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
