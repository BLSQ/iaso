from rest_framework import viewsets
from rest_framework.response import Response

from plugins.polio.models import Campaign, CampaignType
from plugins.polio.preparedness.summary import get_or_set_preparedness_cache_for_round


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
