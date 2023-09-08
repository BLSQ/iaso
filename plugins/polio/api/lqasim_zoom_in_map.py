from drf_yasg.utils import swagger_auto_schema
from iaso.api.common import ModelViewSet
from rest_framework import permissions
import json
from iaso.models.data_store import JsonDataStore
from plugins.polio.helpers import make_safe_bbox
from django.contrib.gis.geos import Polygon
from iaso.models import OrgUnit
from iaso.utils import geojson_queryset
from rest_framework.response import Response
from plugins.polio.helpers import LqasAfroViewset, determine_status_for_district
from plugins.polio.models import Campaign


@swagger_auto_schema(tags=["lqaszoomin"])
class LQASIMZoominMapViewSet(LqasAfroViewset):
    http_method_names = ["get"]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    results_key = "results"

    def get_queryset(self):
        bounds = json.loads(self.request.GET.get("bounds", None))
        bounds_as_polygon = Polygon(
            make_safe_bbox(
                bounds["_southWest"]["lng"],
                bounds["_southWest"]["lat"],
                bounds["_northEast"]["lng"],
                bounds["_northEast"]["lat"],
            )
        )
        # TODO see if we need to filter per user as with Campaign
        return (
            OrgUnit.objects.filter(org_unit_type__category="COUNTRY")
            .exclude(simplified_geom__isnull=True)
            .filter(simplified_geom__intersects=bounds_as_polygon)
        )

    def list(self, request):
        results = []
        requested_round = self.request.GET.get("round", "latest")
        queryset = self.get_queryset()
        bounds = json.loads(request.GET.get("bounds", None))
        bounds_as_polygon = Polygon(
            make_safe_bbox(
                bounds["_southWest"]["lng"],
                bounds["_southWest"]["lat"],
                bounds["_northEast"]["lng"],
                bounds["_northEast"]["lat"],
            )
        )
        data_stores = self.get_datastores()
        for org_unit in queryset:
            start_date_after, end_date_before = self.compute_reference_dates()
            country_id = org_unit.id
            try:
                data_store = data_stores.get(slug__contains=str(country_id))
            except JsonDataStore.DoesNotExist:
                continue
            campaigns = Campaign.objects.filter(country=country_id).filter(deleted_at=None).exclude(is_test=True)

            started_campaigns = [campaign for campaign in campaigns if campaign.is_started()]
            sorted_campaigns = sorted(
                started_campaigns,
                key=lambda campaign: campaign.get_last_round_end_date(),
                reverse=True,
            )

            if start_date_after is not None:
                sorted_campaigns = self.filter_campaigns_by_date(sorted_campaigns, "start", start_date_after)
            if end_date_before is not None:
                sorted_campaigns = self.filter_campaigns_by_date(sorted_campaigns, "end", end_date_before)

            latest_campaign = sorted_campaigns[0] if len(started_campaigns) > 0 and sorted_campaigns else None

            if latest_campaign is None:
                continue
            sorted_rounds = sorted(latest_campaign.rounds.all(), key=lambda round: round.number, reverse=True)
            if requested_round == "latest":
                round_number = sorted_rounds[0].number if len(sorted_rounds) > 0 else None
            elif requested_round == "penultimate" and len(sorted_rounds) > 1:
                round_number = sorted_rounds[1].number if len(sorted_rounds) > 1 else None
            else:
                round_number = int(requested_round)
            if latest_campaign.separate_scopes_per_round:
                scope = latest_campaign.get_districts_for_round_number(round_number)

            else:
                scope = latest_campaign.get_all_districts()
            # Visible districts in scope
            districts = (
                scope.filter(org_unit_type__category="DISTRICT")
                .filter(parent__parent=org_unit.id)
                .exclude(simplified_geom__isnull=True)
                .filter(simplified_geom__intersects=bounds_as_polygon)
            )
            data_for_country = data_store.content
            stats = data_for_country.get("stats", None)
            if stats:
                stats = stats.get(latest_campaign.obr_name, None)
            for district in districts:
                result = None
                district_stats = dict(stats) if stats else None

                if district_stats:
                    district_stats = next(
                        (round for round in district_stats["rounds"] if round["number"] == round_number), None
                    )
                if district_stats:
                    district_stats = next(
                        (
                            data_for_district
                            for data_for_district in district_stats.get("data", {}).values()
                            if data_for_district["district"] == district.id
                        ),
                        None,
                    )
                    if district_stats:
                        district_stats["district_name"] = district.name
                shape_queryset = OrgUnit.objects.filter_for_user_and_app_id(
                    request.user, request.query_params.get("app_id", None)
                ).filter(id=district.id)

                shapes = geojson_queryset(shape_queryset, geometry_field="simplified_geom")

                if district_stats:
                    result = {
                        "id": district.id,
                        "data": {
                            "campaign": latest_campaign.obr_name,
                            **district_stats,
                            "district_name": district.name,
                            "round_number": round_number,
                        },
                        "geo_json": shapes,
                        "status": determine_status_for_district(district_stats),
                    }

                else:
                    result = {
                        "id": district.id,
                        "data": {"campaign": latest_campaign.obr_name, "district_name": district.name},
                        "geo_json": shapes,
                        "status": "inScope",
                    }
                results.append(result)
        return Response({"results": results})


@swagger_auto_schema(tags=["lqaszoominbackground"])
class LQASIMZoominMapBackgroundViewSet(ModelViewSet):
    http_method_names = ["get"]
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    results_key = "results"

    def get_queryset(self):
        bounds = json.loads(self.request.GET.get("bounds", None))
        bounds_as_polygon = Polygon(
            make_safe_bbox(
                bounds["_southWest"]["lng"],
                bounds["_southWest"]["lat"],
                bounds["_northEast"]["lng"],
                bounds["_northEast"]["lat"],
            )
        )
        # TODO see if we need to filter per user as with Campaign
        return (
            OrgUnit.objects.filter(org_unit_type__category="COUNTRY")
            .exclude(simplified_geom__isnull=True)
            .filter(simplified_geom__intersects=bounds_as_polygon)
        )

    def list(self, request):
        org_units = self.get_queryset()
        results = []
        for org_unit in org_units:
            shape_queryset = OrgUnit.objects.filter_for_user_and_app_id(
                request.user, request.query_params.get("app_id", None)
            ).filter(id=org_unit.id)

            shapes = geojson_queryset(shape_queryset, geometry_field="simplified_geom")
            results.append({"id": org_unit.id, "geo_json": shapes})
        return Response({"results": results})
