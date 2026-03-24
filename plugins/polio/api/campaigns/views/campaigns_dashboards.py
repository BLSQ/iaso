from django.db.models import Min, Prefetch
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import permissions

from iaso.api.common import (
    DeletionFilterBackend,
    EtlModelViewset,
)
from iaso.models import OrgUnit
from plugins.polio.api.campaigns.filters.campaign_dashboards_filters import CampaignFiltersForDashboards
from plugins.polio.api.campaigns.filters.search import SearchFilterBackend
from plugins.polio.api.campaigns.serializers.anonymous import AnonymousCampaignSerializer
from plugins.polio.api.campaigns.serializers.campaigns import CampaignSerializer
from plugins.polio.models import (
    Campaign,
)
from plugins.polio.preparedness.spreadsheet_manager import (
    Campaign,
)


class CampaignsForDashboardsViewSet(EtlModelViewset):
    """
    API endpoint for consumption by ETL tools like Openhexa.
    Uses the The same serializers as the main campaigns endpoint: CampaignSerializer and AnonymousCampaignSerializer,
    but the filters are simplified, mostly by ignoring the notion of campaign category
    The parent class enforces pagination and provides default values if the query params are missing
    """

    results_key = "campaigns"
    remove_results_key_if_paginated = False

    filter_backends = [
        DjangoFilterBackend,
        SearchFilterBackend,
        DeletionFilterBackend,
    ]

    filterset_class = CampaignFiltersForDashboards

    # basically just read-only
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    http_method_names = ["get"]

    def get_serializer_class(self):
        if self.request.user.is_authenticated:
            return CampaignSerializer
        return AnonymousCampaignSerializer

    def get_queryset(self):
        """
        Taken from the campaign calendar get_queryset, which itself merges the legacy get_queryset and prefetches from the legacy filter_queryset
        Kept separate as this endpoint is meant not to break existing dashboards, while the campaign and calendar endpoints may still evolve
        """
        user = self.request.user
        org_units_id_only_qs = OrgUnit.objects.only("id", "name")
        country_prefetch = Prefetch("country", queryset=org_units_id_only_qs)
        scopes_group_org_units_prefetch = Prefetch("scopes__group__org_units", queryset=org_units_id_only_qs)
        rounds_scopes_group_org_units_prefetch = Prefetch(
            "rounds__scopes__group__org_units", queryset=org_units_id_only_qs
        )

        campaigns = Campaign.objects.filter_for_user(user)
        campaigns = (
            campaigns.prefetch_related(country_prefetch)
            .prefetch_related("grouped_campaigns")
            .prefetch_related("scopes")
            .prefetch_related("scopes__group")
            .prefetch_related(scopes_group_org_units_prefetch)
            .prefetch_related("rounds")
            .prefetch_related("rounds__datelogs")
            .prefetch_related("rounds__datelogs__modified_by")
            .prefetch_related("rounds__scopes")
            .prefetch_related("rounds__scopes__group")
            .prefetch_related(rounds_scopes_group_org_units_prefetch)
        )
        campaigns = campaigns.annotate(first_round_started_at=Min("rounds__started_at"))
        if not self.request.user.is_authenticated:
            # For this endpoint since it's available anonymously we allow all user to list the campaigns
            # and to additionally filter on the account_id
            # In the future we may want to make the account_id parameter mandatory.
            account_id = self.request.query_params.get("account_id", None)
            if account_id is not None:
                campaigns = campaigns.filter(account_id=account_id)

        return campaigns
