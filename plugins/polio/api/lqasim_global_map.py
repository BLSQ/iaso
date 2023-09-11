from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions
from rest_framework.response import Response

from iaso.models import OrgUnit
from iaso.models.data_store import JsonDataStore
from iaso.utils import geojson_queryset
from plugins.polio.api.common import LqasAfroViewset, calculate_country_status
from plugins.polio.models import Campaign


@swagger_auto_schema(tags=["lqasglobal"])
class LQASIMGlobalMapViewSet(LqasAfroViewset):
    http_method_names = ["get"]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    results_key = "results"

    def get_queryset(self):
        # TODO see if we need to filter per user as with Campaign
        return OrgUnit.objects.filter(org_unit_type__category="COUNTRY").exclude(simplified_geom__isnull=True)

    def list(self, request):
        results = []
        # Should be "lqas", "im_OHH", "im_HH"
        requested_round = self.request.GET.get("round", "latest")
        queryset = self.get_queryset()
        data_stores = self.get_datastores()
        for org_unit in queryset:
            start_date_after, end_date_before = self.compute_reference_dates()
            country_id = org_unit.id
            try:
                data_store = data_stores.get(slug__contains=str(country_id))
            except JsonDataStore.DoesNotExist:
                data_store = None
            # Get shapes
            shape_queryset = OrgUnit.objects.filter_for_user_and_app_id(
                request.user, request.query_params.get("app_id", None)
            ).filter(id=org_unit.id)
            shapes = geojson_queryset(shape_queryset, geometry_field="simplified_geom")

            # Probably not necessary as long as we only have AFRO in the platform
            campaigns = Campaign.objects.filter(country=country_id).filter(deleted_at=None).exclude(is_test=True)
            # Filtering out future campaigns
            started_campaigns = [campaign for campaign in campaigns if campaign.is_started()]
            # By default, we want the last campaign, so we sort them by descending round end date
            sorted_campaigns = (
                sorted(
                    started_campaigns,
                    key=lambda campaign: campaign.get_last_round_end_date(),
                    reverse=True,
                )
                if data_store
                else []
            )
            # We apply the date filters if any. If there's a period filter it has already been taken into account in start_date_after and end_date_before
            if start_date_after is not None:
                sorted_campaigns = self.filter_campaigns_by_date(sorted_campaigns, "start", start_date_after)
            if end_date_before is not None:
                sorted_campaigns = self.filter_campaigns_by_date(sorted_campaigns, "end", end_date_before)
            # And we pick the first one from our sorted list
            latest_campaign = sorted_campaigns[0] if data_store and sorted_campaigns else None
            sorted_rounds = (
                sorted(latest_campaign.rounds.all(), key=lambda round: round.number, reverse=True)
                if latest_campaign is not None
                else []
            )
            # Get data from json datastore
            data_for_country = data_store.content if data_store else None
            # remove data from all campaigns but latest
            stats = data_for_country.get("stats", None) if data_for_country else None
            result = None
            if stats and latest_campaign:
                stats = stats.get(latest_campaign.obr_name, None)
            if stats and latest_campaign:
                round_number = requested_round
                if round_number == "latest":
                    round_number = sorted_rounds[0].number if len(sorted_rounds) > 0 else None
                elif round_number == "penultimate":
                    round_number = sorted_rounds[1].number if len(sorted_rounds) > 1 else None
                else:
                    round_number = int(round_number)
                if latest_campaign:
                    if latest_campaign.separate_scopes_per_round:
                        scope = latest_campaign.get_districts_for_round_number(round_number)

                    else:
                        scope = latest_campaign.get_all_districts()

                result = {
                    "id": int(country_id),
                    "data": {
                        "campaign": latest_campaign.obr_name,
                        **stats,
                        "country_name": org_unit.name,
                        "round_number": round_number,
                    },
                    "geo_json": shapes,
                    "status": calculate_country_status(stats, scope, round_number),
                }
            elif latest_campaign:
                result = {
                    "id": int(country_id),
                    "data": {"campaign": latest_campaign.obr_name, "country_name": org_unit.name},
                    "geo_json": shapes,
                    "status": "inScope",
                }
            else:
                result = {
                    "id": int(country_id),
                    "data": {"country_name": org_unit.name},
                    "geo_json": shapes,
                    "status": "inScope",
                }
            results.append(result)
        return Response({"results": results})
