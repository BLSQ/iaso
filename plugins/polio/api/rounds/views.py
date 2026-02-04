from django.db.models.expressions import Subquery
from drf_yasg.utils import swagger_auto_schema
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response

from iaso.api.common import HasPermission, ModelViewSet
from plugins.polio.api.rounds.serializers import LqasDistrictsUpdateSerializer, RoundSerializer
from plugins.polio.models import Campaign, Round
from plugins.polio.permissions import POLIO_CONFIG_PERMISSION, POLIO_PERMISSION


@swagger_auto_schema(tags=["rounds"], request_body=LqasDistrictsUpdateSerializer)
class RoundViewSet(ModelViewSet):
    # Patch should be in the list to allow updatelqasfields to work
    http_method_names = ["patch"]
    permission_classes = [HasPermission(POLIO_PERMISSION, POLIO_CONFIG_PERMISSION)]
    serializer_class = RoundSerializer
    model = Round

    def partial_update(self):
        """Don't PATCH this way, it will not do anything
        Overriding to prevent patching the whole round which is error prone, due to nested fields among others.
        """

    # Endpoint used to update lqas passed and failed fields by OpenHexa pipeline
    @action(detail=False, methods=["patch"], serializer_class=LqasDistrictsUpdateSerializer)
    def updatelqasfields(self, request):
        round_number = request.data.get("number", None)
        obr_name = request.data.get("obr_name", None)
        user = self.request.user
        if obr_name is None:
            raise serializers.ValidationError({"obr_name": "This field is required"})
        if round_number is None:
            raise serializers.ValidationError({"round_number": "This field is required"})
        try:
            campaigns_for_user = Campaign.objects.filter_for_user(user)
            round_instance = Round.objects.filter(
                campaign__obr_name__in=Subquery(campaigns_for_user.values("obr_name"))
            )
            round_instance = round_instance.get(campaign__obr_name=obr_name, number=round_number)
            serializer = LqasDistrictsUpdateSerializer(data=request.data, context={"request": request}, partial=True)
            serializer.is_valid(raise_exception=True)
            res = serializer.update(round_instance, serializer.validated_data)
            serialized_data = RoundSerializer(res).data
            return Response(serialized_data)
        except:
            return Response(status=status.HTTP_404_NOT_FOUND)
