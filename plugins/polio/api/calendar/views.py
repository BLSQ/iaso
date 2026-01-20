from django.db.models import Prefetch
from django_filters.rest_framework import DjangoFilterBackend  # type: ignore
from rest_framework import permissions

from iaso.api.common import (
    DeletionFilterBackend,
    ModelViewSet,
)
from iaso.models import OrgUnit
from plugins.polio.api.calendar.filter import CalendarFilter, CalendarPeriodFilterBackend
from plugins.polio.api.calendar.serializers import CalendarCampaignSerializerV2
from plugins.polio.models import (
    Campaign,
)
from plugins.polio.preparedness.spreadsheet_manager import (
    Campaign,
)


class CampaignCalendarViewSet(ModelViewSet):
    """Main endpoint for campaign.

    GET (Anonymously too)
    See swagger for Parameters
    """

    results_key = "campaigns"
    http_method_names = ["get"]
    remove_results_key_if_paginated = True
    filter_backends = [
        DjangoFilterBackend,
        CalendarPeriodFilterBackend,
        DeletionFilterBackend,
    ]

    # ordering_fields = [
    #     "obr_name",
    #     "cvdpv2_notified_at",
    #     "detection_status",
    #     "first_round_started_at",
    #     "last_round_started_at",
    #     "country__name",
    # ]

    filterset_class = CalendarFilter

    # We allow anonymous read access for the embeddable calendar map view
    # in this case we use a restricted serializer with less field
    # notably not the url that we want to remain private.
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    export_filename = "campaigns_list_{date}.csv"
    use_field_order = False

    def get_serializer_class(self):
        return CalendarCampaignSerializerV2

    def get_queryset(self):
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
        if not self.request.user.is_authenticated:
            # For this endpoint since it's available anonymously we allow all user to list the campaigns
            # and to additionally filter on the account_id
            # In the future we may want to make the account_id parameter mandatory.
            account_id = self.request.query_params.get("account_id", None)
            if account_id is not None:
                campaigns = campaigns.filter(account_id=account_id)
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

        return campaigns
