from rest_framework import status

from iaso.tests.api.org_unit_change_request_configurations.common_base_with_setup import OUCRCAPIBase


class MobileOrgUnitChangeRequestConfigurationAPITestCase(OUCRCAPIBase):
    """
    Test mobile OUCRCViewSet.
    """

    MOBILE_OUCRC_API_URL = "/api/mobile/orgunits/changes/configs/"

    def test_list_ok(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        with self.assertNumQueries(7):
            # get_queryset
            #   1. COUNT(*) OrgUnitChangeRequestConfiguration
            #   2. SELECT OrgUnitChangeRequestConfiguration
            #   3. PREFETCH OrgUnitChangeRequestConfiguration.possible_types
            #   4. PREFETCH OrgUnitChangeRequestConfiguration.possible_parent_types
            #   5. PREFETCH OrgUnitChangeRequestConfiguration.group_sets
            #   6. PREFETCH OrgUnitChangeRequestConfiguration.editable_reference_forms
            #   7. PREFETCH OrgUnitChangeRequestConfiguration.other_groups
            response = self.client.get(f"{self.MOBILE_OUCRC_API_URL}?app_id={self.app_id}")
            self.assertJSONResponse(response, status.HTTP_200_OK)
            self.assertEqual(3, len(response.data["results"]))  # the 3 OUCRCs from setup

    def test_list_without_auth(self):
        response = self.client.get(f"{self.MOBILE_OUCRC_API_URL}?app_id={self.app_id}")
        self.assertJSONResponse(response, status.HTTP_401_UNAUTHORIZED)

    def test_list_error_missing_app_id(self):
        self.client.force_authenticate(self.user_ash_ketchum)
        response = self.client.get(f"{self.MOBILE_OUCRC_API_URL}")
        self.assertJSONResponse(response, status.HTTP_400_BAD_REQUEST)
