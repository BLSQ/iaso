import django_filters

from django.conf import settings
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from iaso.api.common import HasPermission
from plugins.polio.models import Campaign, CampaignType
from plugins.polio.models.base import Round, SpreadSheetImport
from plugins.polio.permissions import POLIO_CONFIG_PERMISSION, POLIO_PERMISSION
from plugins.polio.preparedness.parser import get_preparedness
from plugins.polio.preparedness.summary import get_or_set_preparedness_cache_for_round, preparedness_summary


class PreparednessScoreFilter(django_filters.rest_framework.FilterSet):
    url = django_filters.CharFilter(method="filter_url")  # campaign + round number or spreadsheet url?
    date = django_filters.DateFilter(
        method="filter_date", lookup_expr="lte", input_formats=settings.API_DATE_INPUT_FORMATS
    )

    def filter_url(self, queryset, name, value):
        return queryset.filter(url=value)

    def filter_date(self, queryset, name, value):
        """This filter returns a quersyet with a single object in it.
        Ideally we cached data on the reference date. But if for some reason the snapshot failed, we want the closest cache entry BEFORE the date.
        That's because it's used to see the score of campaigns that missed the preparedness objectives on the reference date.
        If we pick a later date, we risk showing cache data that meets the objectives
        """

        queryset = queryset.filter(created_at__lte=value)
        if queryset.exists():
            return queryset.order_by("-created_at")[:1]
        return queryset.none()


class PreparednessScoreSerializer(serializers.Serializer):
    campaign_details = serializers.SerializerMethodField()
    scores = serializers.SerializerMethodField()

    def get_campaign_details(self, obj: SpreadSheetImport):
        round_qs = Round.objects.filter(preparedness_spreadsheet_url=obj.url).select_related("campaign")
        if round_qs.count() > 1:
            rounds_list = list(round_qs.values_list("id", flat=True))
            raise Exception(f"Found more than one round for url:{rounds_list}")
        if not round_qs.exists():
            return {}
        round = round_qs.first()
        return {"round_id": round.id, "round_number": round.number, "campaign": round.campaign.obr_name}

    def get_scores(self, obj: SpreadSheetImport):
        cached_spreadsheet = obj.cached_spreadsheet
        preparedness_data = get_preparedness(cached_spreadsheet)
        summary = preparedness_summary(preparedness_data)
        score = summary["overall_status_score"]
        return {"score": score, **preparedness_data["totals"]}


class PreparednessDashboardViewSet(viewsets.ViewSet):
    def list(self, request):
        r = []
        polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
        qs = Campaign.objects.filter(campaign_types=polio_type).prefetch_related("rounds")
        if request.query_params.get("campaign"):
            qs = qs.filter(obr_name=request.query_params.get("campaign"))

        for c in qs:
            for round in c.rounds.all():
                p = get_or_set_preparedness_cache_for_round(c, round)
                if p:
                    r.append(p)
        return Response(r)

    @action(
        detail=False,
        methods=["get"],
        permission_classes=[HasPermission(POLIO_PERMISSION, POLIO_CONFIG_PERMISSION)],
    )
    def score(self, request, **kwargs):
        missing_params = [p for p in ("url", "date") if p not in request.query_params]
        if missing_params:
            raise ValidationError({p: f"Missing mandatory filter query parameter: '{p}'" for p in missing_params})
        queryset = SpreadSheetImport.objects.all()
        filter = PreparednessScoreFilter(request.query_params, queryset=queryset)
        filtered_qs = filter.qs
        if not filtered_qs.exists():
            return Response({})
        obj = filtered_qs.first()
        serializer = PreparednessScoreSerializer(obj)
        return Response(serializer.data)
