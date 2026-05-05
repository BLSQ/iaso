from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.response import Response

from iaso.api.common import ModelViewSet
from plugins.polio.models import Campaign


vaccine_stock_id_param = OpenApiParameter(
    name="vaccine_stock",
    location=OpenApiParameter.QUERY,
    description="The Vaccine Stock id related to the current object",
    type=OpenApiTypes.INT,
    required=False,
)


class VaccineStockSubitemBase(ModelViewSet):
    allowed_methods = ["get", "post", "head", "options", "patch", "delete"]
    model_class = None

    @extend_schema(
        parameters=[vaccine_stock_id_param],
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    def get_queryset(self):
        vaccine_stock_id = self.request.query_params.get("vaccine_stock")
        order = self.request.query_params.get("order")

        if self.model_class is None:
            raise NotImplementedError("model_class must be defined")

        queryset = self.model_class.objects.filter(vaccine_stock__account=self.request.user.iaso_profile.account)

        if vaccine_stock_id is not None:
            queryset = queryset.filter(vaccine_stock=vaccine_stock_id)

        if order:
            queryset = queryset.order_by(order)

        return queryset


class VaccineStockSubitemEdit(VaccineStockSubitemBase):
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Extract campaign data
        campaign_data = serializer.validated_data.get("campaign")
        round_data = serializer.validated_data.get("round")

        campaign = None
        _round = None

        if campaign_data:
            campaign_obr_name = campaign_data.get("obr_name")
            campaign = Campaign.objects.get(obr_name=campaign_obr_name, account=request.user.iaso_profile.account)

            if round_data:
                round_number = round_data.get("number")
                _round = campaign.rounds.get(number=round_number)

        # Update validated data
        serializer.validated_data["campaign"] = campaign
        serializer.validated_data["round"] = _round

        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        # Extract campaign data
        campaign_data = serializer.validated_data.get("campaign")
        round_data = serializer.validated_data.get("round")

        campaign = None
        _round = None

        if campaign_data:
            campaign_obr_name = campaign_data.get("obr_name")
            campaign = Campaign.objects.get(obr_name=campaign_obr_name, account=request.user.iaso_profile.account)

            if round_data:
                round_number = round_data.get("number")
                _round = campaign.rounds.get(number=round_number)

        serializer.validated_data["campaign"] = campaign
        serializer.validated_data["round"] = _round

        self.perform_update(serializer)
        return Response(serializer.data)
