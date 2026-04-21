from drf_spectacular.utils import extend_schema
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.common import HasPermission
from plugins.polio.api.dashboards.preparedness.filters import PreparednessDashboardFilter, PreparednessScoreFilter
from plugins.polio.api.dashboards.preparedness.serializers import ParamsSerializer, PreparednessScoreSerializer
from plugins.polio.models import Campaign, CampaignType
from plugins.polio.models.base import Round, SpreadSheetImport
from plugins.polio.permissions import POLIO_CONFIG_PERMISSION, POLIO_PERMISSION
from plugins.polio.preparedness.summary import get_or_set_preparedness_cache_for_round


@extend_schema(tags=["Polio - Dashboards - Preparedness"])
class PreparednessDashboardViewSet(viewsets.ViewSet):
    http_method_names = ["get"]
    filterset_class = PreparednessDashboardFilter

    def get_queryset(self):
        if self.action == "list":
            polio_type = CampaignType.objects.get(name=CampaignType.POLIO)
            return Campaign.objects.filter(campaign_types=polio_type).prefetch_related("rounds")
        if self.action == "score":
            return SpreadSheetImport.objects.all()

    def get_serializer_class(self):
        if self.action == "score":
            return PreparednessScoreSerializer

    def list(self, request):
        r = []
        qs = self.get_queryset()
        qs = PreparednessDashboardFilter(request.query_params, queryset=qs).qs

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
        params_serializer = ParamsSerializer(data=request.query_params)
        params_serializer.is_valid(raise_exception=True)
        queryset = self.get_queryset()
        filter = PreparednessScoreFilter(request.query_params, queryset=queryset)
        filtered_qs = filter.qs
        obj = filtered_qs.first()
        if not obj:
            return Response({})

        round_qs = (
            Round.objects.filter(preparedness_spreadsheet_url=obj.url)
            .select_related("campaign")
            .only("id", "number", "campaign__obr_name")
        )
        if round_qs.count() > 1:
            rounds_list = list(round_qs.values_list("id", flat=True))
            return Response(
                {"error": f"Found more than one round for url: {rounds_list}"},
                status=status.HTTP_409_CONFLICT,
            )

        round_obj = round_qs.first()
        obj.round_id = round_obj.id if round_obj else None
        obj.round_number = round_obj.number if round_obj else None
        obj.campaign = round_obj.campaign.obr_name if round_obj else None
        serializer = PreparednessScoreSerializer(obj)
        return Response(serializer.data)
