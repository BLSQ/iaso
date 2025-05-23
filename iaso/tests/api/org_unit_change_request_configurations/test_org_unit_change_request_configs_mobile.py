import datetime

import time_machine

from django.contrib.auth.models import Group
from django.utils import timezone
from rest_framework import status

from iaso import models as m
from iaso.api.query_params import APP_ID, INCLUDE_CREATION
from iaso.tests.api.org_unit_change_request_configurations.common_base_with_setup import OUCRCAPIBase


CREATED_AT = datetime.datetime(2025, 1, 20, 10, 31, 0, 0, tzinfo=timezone.utc)


@time_machine.travel(CREATED_AT, tick=False)
class MobileOrgUnitChangeRequestConfigurationAPITestCase(OUCRCAPIBase):
    """
    Test mobile OUCRCViewSet.
    """

    MOBILE_OUCRC_API_URL = "/api/mobile/orgunits/changes/configs/"

    def test_list_ok(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        with self.assertNumQueries(9):
            # get_queryset
            #   1. SELECT user_editable_org_unit_type_ids
            #   2. SELECT user_roles_editable_org_unit_type_ids
            #   3. COUNT(*) OrgUnitChangeRequestConfiguration
            #   4. SELECT OrgUnitChangeRequestConfiguration
            #   5. PREFETCH OrgUnitChangeRequestConfiguration.possible_types
            #   6. PREFETCH OrgUnitChangeRequestConfiguration.possible_parent_types
            #   7. PREFETCH OrgUnitChangeRequestConfiguration.group_sets
            #   8. PREFETCH OrgUnitChangeRequestConfiguration.editable_reference_forms
            #   9. PREFETCH OrgUnitChangeRequestConfiguration.other_groups
            response = self.client.get(
                f"{self.MOBILE_OUCRC_API_URL}",
                {
                    APP_ID: self.app_id,
                },
            )
            self.assertJSONResponse(response, status.HTTP_200_OK)
            self.assertEqual(3, len(response.data["results"]))  # the 3 edition OUCRCs from setup

    def test_list_ok_with_include_creation(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        with self.assertNumQueries(9):
            # get_queryset
            #   1. SELECT user_editable_org_unit_type_ids
            #   2. SELECT user_roles_editable_org_unit_type_ids
            #   3. COUNT(*) OrgUnitChangeRequestConfiguration
            #   4. SELECT OrgUnitChangeRequestConfiguration
            #   5. PREFETCH OrgUnitChangeRequestConfiguration.possible_types
            #   6. PREFETCH OrgUnitChangeRequestConfiguration.possible_parent_types
            #   7. PREFETCH OrgUnitChangeRequestConfiguration.group_sets
            #   8. PREFETCH OrgUnitChangeRequestConfiguration.editable_reference_forms
            #   9. PREFETCH OrgUnitChangeRequestConfiguration.other_groups
            response = self.client.get(
                f"{self.MOBILE_OUCRC_API_URL}",
                {
                    APP_ID: self.app_id,
                    INCLUDE_CREATION: True,
                },
            )
            self.assertJSONResponse(response, status.HTTP_200_OK)
            self.assertEqual(6, len(response.data["results"]))  # the 6 OUCRCs from setup

    def test_list_ok_with_restricted_write_permission_for_user(self):
        # Add new Org Unit Types.
        new_org_unit_type_1 = m.OrgUnitType.objects.create(name="Hospital")
        new_org_unit_type_1.projects.add(self.project_johto)
        new_org_unit_type_2 = m.OrgUnitType.objects.create(name="Health facility")
        new_org_unit_type_2.projects.add(self.project_johto)
        new_org_unit_type_3 = m.OrgUnitType.objects.create(name="District")
        new_org_unit_type_3.projects.add(self.project_johto)
        self.assertEqual(self.project_johto.unit_types.count(), 6)

        # Restrict write permissions on Org Units at the "Profile" level.
        self.user_ash_ketchum.iaso_profile.editable_org_unit_types.set(
            # Only org units of this type are now writable for this user.
            [self.ou_type_fire_pokemons]
        )

        # Restrict write permissions on Org Units at the "Role" level.
        group = Group.objects.create(name="Group")
        user_role = m.UserRole.objects.create(group=group, account=self.account_pokemon)
        user_role.editable_org_unit_types.set(
            # Only org units of this type are now writable for this user.
            [new_org_unit_type_3]
        )
        self.user_ash_ketchum.iaso_profile.user_roles.set([user_role])

        self.client.force_authenticate(self.user_ash_ketchum)

        with self.assertNumQueries(9):
            response = self.client.get(f"{self.MOBILE_OUCRC_API_URL}?app_id={self.app_id}")
            self.assertJSONResponse(response, status.HTTP_200_OK)

        results = response.data["results"]
        self.assertEqual(5, len(results))

        # `new_org_unit_type_3` should not be in the response because the user
        # have full write permission on it:
        # - the user has write access on `new_org_unit_type_3` at his Profile level
        # - there is no existing configuration for `new_org_unit_type_3`
        configs_org_unit_type_ids = [config["org_unit_type_id"] for config in results]
        self.assertNotIn(new_org_unit_type_3.pk, configs_org_unit_type_ids)

        self.assertEqual(
            results,
            [
                # The user has write access on `ou_type_fire_pokemons` at his Profile level,
                # and there is an existing configuration for `ou_type_fire_pokemons`, so we
                # return the configuration.
                {
                    "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
                    "org_unit_type_id": self.ou_type_fire_pokemons.pk,
                    "org_units_editable": True,
                    "editable_fields": ["name", "aliases", "location", "opening_date", "closing_date"],
                    "possible_type_ids": list(self.oucrc_type_fire.possible_types.values_list("id", flat=True)),
                    "possible_parent_type_ids": list(
                        self.oucrc_type_fire.possible_parent_types.values_list("id", flat=True)
                    ),
                    "group_set_ids": list(self.oucrc_type_fire.group_sets.values_list("id", flat=True)),
                    "editable_reference_form_ids": list(
                        self.oucrc_type_fire.editable_reference_forms.values_list("id", flat=True)
                    ),
                    "other_group_ids": list(self.oucrc_type_fire.other_groups.values_list("id", flat=True)),
                    "created_at": self.oucrc_type_fire.created_at.timestamp(),
                    "updated_at": self.oucrc_type_fire.updated_at.timestamp(),
                },
                # Because of the configuration of his Profile, the user can't write on `ou_type_rock_pokemons`,
                # so we override the existing configuration.
                {
                    "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
                    "org_unit_type_id": self.ou_type_rock_pokemons.pk,
                    "org_units_editable": False,
                    "editable_fields": [],
                    "possible_type_ids": [],
                    "possible_parent_type_ids": [],
                    "group_set_ids": [],
                    "editable_reference_form_ids": [],
                    "other_group_ids": [],
                    "created_at": CREATED_AT.timestamp(),
                    "updated_at": CREATED_AT.timestamp(),
                },
                # Because of the configuration of his Profile, the user can't write on `ou_type_water_pokemons`,
                # so we override the existing configuration.
                {
                    "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
                    "org_unit_type_id": self.ou_type_water_pokemons.pk,
                    "org_units_editable": False,
                    "editable_fields": [],
                    "possible_type_ids": [],
                    "possible_parent_type_ids": [],
                    "group_set_ids": [],
                    "editable_reference_form_ids": [],
                    "other_group_ids": [],
                    "created_at": CREATED_AT.timestamp(),
                    "updated_at": CREATED_AT.timestamp(),
                },
                # Because of the configuration of his Profile, the user can't write on `new_org_unit_type_1`,
                # and since there is no existing configuration, we add a dynamic one.
                {
                    "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
                    "org_unit_type_id": new_org_unit_type_1.pk,
                    "org_units_editable": False,
                    "editable_fields": [],
                    "possible_type_ids": [],
                    "possible_parent_type_ids": [],
                    "group_set_ids": [],
                    "editable_reference_form_ids": [],
                    "other_group_ids": [],
                    "created_at": CREATED_AT.timestamp(),
                    "updated_at": CREATED_AT.timestamp(),
                },
                # Because of the configuration of his Profile, the user can't write on `new_org_unit_type_2`,
                # and since there is no existing configuration, we add a dynamic one.
                {
                    "type": m.OrgUnitChangeRequestConfiguration.Type.EDITION,
                    "org_unit_type_id": new_org_unit_type_2.pk,
                    "org_units_editable": False,
                    "editable_fields": [],
                    "possible_type_ids": [],
                    "possible_parent_type_ids": [],
                    "group_set_ids": [],
                    "editable_reference_form_ids": [],
                    "other_group_ids": [],
                    "created_at": CREATED_AT.timestamp(),
                    "updated_at": CREATED_AT.timestamp(),
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
