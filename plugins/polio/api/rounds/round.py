from django.db.models.expressions import Subquery
from django.db.transaction import atomic
from drf_yasg.utils import swagger_auto_schema
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.api.common import HasPermission, ModelViewSet
from plugins.polio.api.shared_serializers import (
    GroupSerializer,
    RoundDateHistoryEntrySerializer,
)
from plugins.polio.models import Round, RoundDateHistoryEntry, RoundScope, Campaign
from plugins.polio.preparedness.summary import set_preparedness_cache_for_round


class RoundScopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundScope
        fields = ["group", "vaccine"]

    group = GroupSerializer()


class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = "__all__"

    scopes = RoundScopeSerializer(many=True, required=False)
    datelogs = RoundDateHistoryEntrySerializer(many=True, required=False)
    districts_count_calculated = serializers.IntegerField(read_only=True)

    # Vaccines from real scopes, from property, separated by ,
    vaccine_names = serializers.CharField(read_only=True)

    @atomic
    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user
        started_at = validated_data.get("started_at", None)
        ended_at = validated_data.get("ended_at", None)
        datelogs = validated_data.get("datelogs", None)
        if datelogs:
            raise serializers.ValidationError({"datelogs": "Cannot have modification history for new round"})
        round = Round.objects.create(**validated_data)
        if started_at is not None or ended_at is not None:
            datelog = RoundDateHistoryEntry.objects.create(round=round, reason="INITIAL_DATA", modified_by=user)
            if started_at is not None:
                datelog.started_at = started_at
            if ended_at is not None:
                datelog.ended_at = ended_at
            datelog.save()
        return round

    @atomic
    def update(self, instance, validated_data):
        request = self.context.get("request")
        user = request.user
        updated_datelogs = validated_data.pop("datelogs", [])
        # from pprint import pprint

        # print("DATELOGS")
        # pprint(validated_data)
        # pprint(self.data)

        has_datelog = instance.datelogs.count() > 0
        if updated_datelogs:
            new_datelog = updated_datelogs[-1]
            datelog = None
            if has_datelog:
                last_entry = instance.datelogs.order_by("-created_at").first()
                # if instance.datelogs.count() >= len(updated_datelogs) it means there was an update that was missed between input and confirmation
                # This could lead to errors in the log with the previous_started_at and previous_ended_at fields
                if len(updated_datelogs) >= instance.datelogs.count():
                    new_datelog["previous_started_at"] = last_entry.started_at
                    new_datelog["previous_ended_at"] = last_entry.ended_at
                if (
                    new_datelog["reason"] != last_entry.reason
                    or new_datelog["started_at"] != last_entry.started_at
                    or new_datelog["ended_at"] != last_entry.ended_at
                ) and new_datelog["reason"] != "INITIAL_DATA":
                    datelog = RoundDateHistoryEntry.objects.create(round=instance, modified_by=user)
            else:
                datelog = RoundDateHistoryEntry.objects.create(round=instance, reason="INITIAL_DATA", modified_by=user)
            if datelog is not None:
                datelog_serializer = RoundDateHistoryEntrySerializer(instance=datelog, data=new_datelog)
                datelog_serializer.is_valid(raise_exception=True)
                datelog_instance = datelog_serializer.save()
                instance.datelogs.add(datelog_instance)

        round = super().update(instance, validated_data)
        # update the preparedness cache in case we touched the spreadsheet url
        set_preparedness_cache_for_round(round)
        return round


class LqasDistrictsUpdateSerializer(serializers.Serializer):
    number = serializers.IntegerField(required=True)
    lqas_district_failing = serializers.IntegerField(required=True)
    lqas_district_passing = serializers.IntegerField(required=True)
    obr_name = serializers.CharField(required=True)

    def update(self, instance, validated_data):
        instance.lqas_district_passing = validated_data["lqas_district_passing"]
        instance.lqas_district_failing = validated_data["lqas_district_failing"]
        instance.save()
        return instance


@swagger_auto_schema(tags=["rounds"], request_body=LqasDistrictsUpdateSerializer)
class RoundViewset(ModelViewSet):
    # Patch should be in the list to allow updatelqasfields to work
    http_method_names = ["patch"]
    permission_classes = [HasPermission(permission.POLIO, permission.POLIO_CONFIG)]  # type: ignore
    serializer_class = RoundSerializer
    model = Round

    def partial_update(self):
        """Don't PATCH this way, it will not do anything
        Overriding to prevent patching the whole round which is error prone, due to nested fields among others.
        """
        pass

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
