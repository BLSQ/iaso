import django_filters

from django.conf import settings
from rest_framework import serializers, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response

from plugins.polio.models import Campaign, CampaignType
from plugins.polio.models.base import Round, SpreadSheetImport
from plugins.polio.preparedness.parser import get_preparedness
from plugins.polio.preparedness.summary import get_or_set_preparedness_cache_for_round


class PreparednessScoreFilter(django_filters.rest_framework.FilterSet):
    url = django_filters.NumberFilter(method="filter_url")  # campaign + round number or spreadsheet url?
    date = django_filters.DateFilter(
        method="filter_date", lookup_expr="lte", input_formats=settings.API_DATE_INPUT_FORMATS
    )

    def filter_url(self, queryset, name, value):
        if not value:
            raise ValidationError("Missing mandatory filter query parameter: 'url'")
        return queryset.filter(url=value)

    def filter_date(self, queryset, name, value):
        """This filter returns a quersyet with a single object in it.
        Ideally we cached data on the reference date. But if for some reason the snapshot failed, we want the closest cache entry BEFORE the date.
        That's because it's used to see the score of campaigns that missed the preparedness objectives on the reference date.
        If we pick a later date, we risk showing cache data that meets the objectives
        """
        if not value:
            raise ValidationError("Missing mandatory filter query parameter: 'date'")
        queryset = queryset.filter(created_at__lte=value)
        if queryset.exists():
            return queryset.order_by("-created_at")[:1]
        return queryset.none()


class PreparednessScoreSerializer(serializers.Serializer):
    campaign_details = serializers.SerializerMethodField()
    scores = serializers.SerializerMethodField()

    def get_campaign_details(self, obj: SpreadSheetImport):
        round = Round.objects.filter(preparedness_spreadsheet_url=obj.url).select_related("campaign").first()
        if not round:
            return {}
        return {"round_id": round.id, "round_number": round.number, "campaign": round.campaign.obr_name}

    def get_scores(self, obj: SpreadSheetImport):
        cached_spreadsheet = obj.cached_spreadsheet
        preparedness_data = get_preparedness(cached_spreadsheet)
        return preparedness_data["totals"]


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
    )
    def score(self, request, **kwargs):
        queryset = SpreadSheetImport.objects.all()
        filter = PreparednessScoreFilter(request.query_params, queryset=queryset)
        filtered_qs = filter.qs
        if not filtered_qs.exists():
            return Response({})
        obj = filtered_qs.first()
        serializer = PreparednessScoreSerializer(obj)
        return Response(serializer.data)
