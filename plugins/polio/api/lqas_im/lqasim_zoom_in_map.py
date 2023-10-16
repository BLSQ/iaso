import datetime as dt
import json
from datetime import timedelta

from django.contrib.gis.geos import Polygon
from django.db.models import Q, Subquery
from drf_yasg.utils import swagger_auto_schema
from rest_framework import permissions
from rest_framework.response import Response

from iaso.api.common import ModelViewSet
from iaso.models import OrgUnit
from iaso.models.data_store import JsonDataStore
from iaso.utils import geojson_queryset
from plugins.polio.api.common import LQASStatus, RoundSelection, determine_status_for_district, make_safe_bbox
from plugins.polio.api.lqas_im.base_viewset import LqasAfroViewset
from plugins.polio.models import Campaign, Round


def get_latest_active_campaign_and_rounds(org_unit, start_date_after, end_date_before):
    today = dt.date.today()
    latest_active_round_qs = Round.objects.filter(campaign__country=org_unit)
    if start_date_after is not None:
        latest_active_round_qs = latest_active_round_qs.filter(started_at__gte=start_date_after)
    if end_date_before is not None:
        latest_active_round_qs = latest_active_round_qs.filter(ended_at__lte=end_date_before)

    # filter out rounds that start in the future
    # Filter by finished rounds and lqas dates ended. If no lqas end date, using end date +10 days (as in pipeline)
    buffer = today - timedelta(days=10)
    latest_active_round_qs = (
        latest_active_round_qs.filter(
            Q(lqas_ended_at__lte=today) | (Q(lqas_ended_at__isnull=True) & Q(ended_at__lte=buffer))
        )
        .filter(campaign__deleted_at__isnull=True)
        .exclude(campaign__is_test=True)
        .order_by("-started_at")[:1]
    )
    latest_active_campaign = (
        Campaign.objects.filter(id__in=Subquery(latest_active_round_qs.values("campaign")))
        .filter(deleted_at=None)
        .exclude(is_test=True)
        .prefetch_related("rounds")
        .first()
    )
    if latest_active_campaign is None:
        return None, None, None
    # Filter by finished rounds and lqas dates ended
    latest_active_campaign_rounds = latest_active_campaign.rounds.filter(ended_at__lte=today).filter(
        (Q(lqas_ended_at__lte=today)) | (Q(lqas_ended_at__isnull=True) & Q(ended_at__lte=today - timedelta(days=10)))
    )
    latest_active_campaign_rounds = latest_active_campaign_rounds.order_by("-number")
    round_numbers = latest_active_campaign_rounds.values_list("number", flat=True)

    return latest_active_campaign, latest_active_campaign_rounds, round_numbers


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
            ) = get_latest_active_campaign_and_rounds(org_unit, start_date_after, end_date_before)

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
            scope_qs = OrgUnit.objects.filter(id__in=[ou.id for ou in scope])
            districts = (
                scope_qs.filter(org_unit_type__category="DISTRICT")
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
                        "country_id": country_id,
                        "country_name": org_unit.name,
                    }

                else:
                    result = {
                        "id": district.id,
                        "data": {"campaign": latest_active_campaign.obr_name, "district_name": district.name},
                        "geo_json": shapes,
                        "status": LQASStatus.InScope,
                        "country_id": country_id,
                        "country_name": org_unit.name,
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
