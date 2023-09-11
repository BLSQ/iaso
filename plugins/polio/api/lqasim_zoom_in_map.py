import json

from django.contrib.gis.geos import Polygon
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions
from rest_framework.response import Response

from iaso.api.common import ModelViewSet
from iaso.models import OrgUnit
from iaso.models.data_store import JsonDataStore
from iaso.utils import geojson_queryset
from plugins.polio.api.common import (
    LQASStatus,
    LqasAfroViewset,
    RoundSelection,
    determine_status_for_district,
    make_safe_bbox,
)
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
            ),
        )
        # TODO see if we need to filter per user as with Campaign
        return (
            OrgUnit.objects.filter(org_unit_type__category="COUNTRY")
            .exclude(simplified_geom__isnull=True)
            .filter(simplified_geom__intersects=bounds_as_polygon)
        )

    def list(self, request):
        results = []
        requested_round = self.request.GET.get("round", RoundSelection.Latest)
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

            (
                latest_active_campaign,
                latest_active_campaign_rounds,
                round_numbers,
            ) = self.get_latest_active_campaign_and_rounds(org_unit, start_date_after, end_date_before)

            if latest_active_campaign is None:
                continue
            if requested_round == RoundSelection.Latest:
                round_number = (
                    latest_active_campaign_rounds[0].number if latest_active_campaign_rounds.count() > 0 else None
                )
            elif requested_round == RoundSelection.Penultimate:
                round_number = (
                    latest_active_campaign_rounds[1].number if latest_active_campaign_rounds.count() > 1 else None
                )
            else:
                round_number = int(requested_round)
                if round_number not in round_numbers:
                    round_number = None
            if round_number is None:
                continue
            if latest_active_campaign.separate_scopes_per_round:
                scope = latest_active_campaign.get_districts_for_round_number(round_number)

            else:
                scope = latest_active_campaign.get_all_districts()
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
                stats = stats.get(latest_active_campaign.obr_name, None)
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
                            "campaign": latest_active_campaign.obr_name,
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
                        "data": {"campaign": latest_active_campaign.obr_name, "district_name": district.name},
                        "geo_json": shapes,
                        "status": LQASStatus.InScope,
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
        qs = (
            OrgUnit.objects.filter(org_unit_type__category="COUNTRY")
            .exclude(simplified_geom__isnull=True)
            .filter(simplified_geom__intersects=bounds_as_polygon)
        )
        print("Query", qs.query)
        return qs

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
