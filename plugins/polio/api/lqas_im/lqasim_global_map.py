from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions
from rest_framework.response import Response

from iaso.models import OrgUnit
from iaso.models.data_store import JsonDataStore
from iaso.utils import geojson_queryset
from plugins.polio.api.common import LqasAfroViewset, calculate_country_status, LQASStatus, RoundSelection
from plugins.polio.api.lqas_im.lqasim_zoom_in_map import get_latest_active_campaign_and_rounds


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
        requested_round = self.request.GET.get("round", RoundSelection.Latest)
        queryset = self.get_queryset()
        data_stores = self.get_datastores()
        for org_unit in queryset:
            result = None
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

            (
                latest_active_campaign,
                latest_active_campaign_rounds,
                round_numbers,
            ) = get_latest_active_campaign_and_rounds(org_unit, start_date_after, end_date_before)

            if latest_active_campaign is None:
                continue

            # Get data from json datastore
            data_for_country = data_store.content if data_store else None
            # remove data from all campaigns but latest
            stats = data_for_country.get("stats", None) if data_for_country else None

            if stats:
                stats = stats.get(latest_active_campaign.obr_name, None)
            if stats:
                round_number = requested_round
                if round_number == RoundSelection.Latest:
                    round_number = (
                        latest_active_campaign_rounds.first().number
                        if latest_active_campaign_rounds.count() > 0
                        else None
                    )
                elif round_number == RoundSelection.Penultimate:
                    round_number = (
                        latest_active_campaign_rounds[1].number if latest_active_campaign_rounds.count() > 1 else None
                    )
                else:
                    round_number = int(round_number)
                    if round_number not in round_numbers:
                        round_number = None
                if round_number is None:
                    continue
                if latest_active_campaign.separate_scopes_per_round:
                    scope = latest_active_campaign.get_districts_for_round_number(round_number)

                else:
                    scope = latest_active_campaign.get_all_districts()

                result = {
                    "id": int(country_id),
                    "data": {
                        "campaign": latest_active_campaign.obr_name,
                        **stats,
                        "country_name": org_unit.name,
                        "round_number": round_number,
                    },
                    "geo_json": shapes,
                    "status": calculate_country_status(stats, scope, round_number),
                }
            else:
                result = {
                    "id": int(country_id),
                    "data": {"campaign": latest_active_campaign.obr_name, "country_name": org_unit.name},
                    "geo_json": shapes,
                    "status": LQASStatus.InScope,
                }
            results.append(result)
        return Response({"results": results})
