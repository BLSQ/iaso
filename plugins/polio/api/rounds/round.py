from django.db.models.expressions import Subquery
from django.db.transaction import atomic
from drf_yasg.utils import swagger_auto_schema
from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.response import Response

from hat.menupermissions import models as permission
from iaso.api.common import HasPermission, ModelViewSet, UserSerializer
from plugins.polio.api.shared_serializers import (
    DestructionSerializer,
    GroupSerializer,
    RoundDateHistoryEntryForRoundSerializer,
    RoundVaccineSerializer,
)
from plugins.polio.models import (
    Destruction,
    ReasonForDelay,
    Round,
    RoundDateHistoryEntry,
    RoundScope,
    RoundVaccine,
    Shipment,
    Campaign,
)
from plugins.polio.preparedness.summary import set_preparedness_cache_for_round


class RoundScopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundScope
        fields = ["group", "vaccine"]

    group = GroupSerializer()


class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = [
            "po_numbers",
            "vials_received",
            "estimated_arrival_date",
            "reception_pre_alert",
            "date_reception",
            "vaccine_name",
            "comment",
            "id",
        ]


class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = "__all__"

    scopes = RoundScopeSerializer(many=True, required=False)
    vaccines = RoundVaccineSerializer(many=True, required=False)
    shipments = ShipmentSerializer(many=True, required=False)
    destructions = DestructionSerializer(many=True, required=False)
    datelogs = RoundDateHistoryEntryForRoundSerializer(many=True, required=False)
    districts_count_calculated = serializers.IntegerField(read_only=True)

    # Vaccines from real scopes, from property, separated by ,
    vaccine_names = serializers.CharField(read_only=True)

    @atomic
    def create(self, validated_data):
        request = self.context.get("request")
        user = request.user
        vaccines = validated_data.pop("vaccines", [])
        shipments = validated_data.pop("shipments", [])
        destructions = validated_data.pop("destructions", [])
        started_at = validated_data.get("started_at", None)
        ended_at = validated_data.get("ended_at", None)
        datelogs = validated_data.pop("datelogs", None)
        if datelogs:
            raise serializers.ValidationError({"datelogs": "Cannot have modification history for new round"})
        round = Round.objects.create(**validated_data)
        if started_at is not None or ended_at is not None:
            reason_for_delay = ReasonForDelay.objects.filter(key_name="INITIAL_DATA").first()
            datelog = RoundDateHistoryEntry.objects.create(
                round=round, reason="INITIAL_DATA", reason_for_delay=reason_for_delay, modified_by=user
            )
            if started_at is not None:
                datelog.started_at = started_at
            if ended_at is not None:
                datelog.ended_at = ended_at
            datelog.save()
        for vaccine in vaccines:
            RoundVaccine.objects.create(round=round, **vaccine)
        for shipment in shipments:
            Shipment.objects.create(round=round, **shipment)
        for destruction in destructions:
            Destruction.objects.create(round=round, **destruction)
        return round

    @atomic
    def update(self, instance, validated_data):
        request = self.context.get("request")
        user = request.user
        account = user.iaso_profile.account
        updated_datelogs = validated_data.pop("datelogs", [])

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
                    new_datelog["reason_for_delay"].id != last_entry.reason_for_delay.id
                    or new_datelog["started_at"] != last_entry.started_at
                    or new_datelog["ended_at"] != last_entry.ended_at
                ) and new_datelog[
                    "reason_for_delay"
                ].key_name != "INITIAL_DATA":  # INITAL_DATA should prolly be put in a const somewhere
                    datelog = RoundDateHistoryEntry.objects.create(round=instance, modified_by=user)
            else:
                try:
                    reason_for_delay = ReasonForDelay.objects.filter(account=account).get(key_name="INITIAL_DATA")
                except ReasonForDelay.DoesNotExist:
                    # Fallback on first reason available for account
                    reason_for_delay = ReasonForDelay.filter(account=account).first()
                datelog = RoundDateHistoryEntry.objects.create(
                    round=instance, reason="INITIAL_DATA", reason_for_delay=reason_for_delay, modified_by=user
                )
            if datelog is not None:
                # Replace instance with key_name to avoid validation error
                datelog_serializer = RoundDateHistoryEntryForRoundSerializer(
                    instance=datelog,
                    data={**new_datelog, "reason_for_delay": new_datelog["reason_for_delay"].key_name},
                    context=self.context,
                )
                datelog_serializer.is_valid(raise_exception=True)
                datelog_instance = datelog_serializer.save()
                instance.datelogs.add(datelog_instance)

        # VACCINE STOCK
        vaccines = validated_data.pop("vaccines", [])
        vaccine_instances = []
        for vaccine_data in vaccines:
            round_vaccine = None
            if vaccine_data.get("id"):
                round_vaccine_id = vaccine_data["id"]
                round_vaccine = RoundVaccine.objects.get(pk=round_vaccine_id)
                if round_vaccine.round != instance:
                    raise serializers.ValidationError({"vaccines": "vaccine is attached to wrong round"})
            elif vaccine_data.get("name"):
                vaccine_name = vaccine_data["name"]
                round_vaccine, create = instance.vaccines.get_or_create(name=vaccine_name)
            round_vaccine_serializer = RoundVaccineSerializer(instance=round_vaccine, data=vaccine_data)
            round_vaccine_serializer.is_valid(raise_exception=True)
            round_vaccine_instance = round_vaccine_serializer.save()
            vaccine_instances.append(round_vaccine_instance)
        instance.vaccines.set(vaccine_instances)

        # SHIPMENTS
        shipments = validated_data.pop("shipments", [])
        shipment_instances = []
        current_shipment_ids = []
        for shipment_data in shipments:
            if shipment_data.get("id"):
                shipment_id = shipment_data["id"]
                current_shipment_ids.append(shipment_id)
                shipment = Shipment.objects.get(pk=shipment_id)
                if shipment.round != instance:
                    raise serializers.ValidationError({"shipments": "shipment is attached to wrong round"})
            else:
                shipment = Shipment.objects.create()
            shipment_serializer = ShipmentSerializer(instance=shipment, data=shipment_data)
            shipment_serializer.is_valid(raise_exception=True)
            shipment_instance = shipment_serializer.save()
            shipment_instances.append(shipment_instance)
        # remove deleted shipments, ie existing shipments whose id wasn't sent in the request
        all_current_shipments = instance.shipments.all()
        for current in all_current_shipments:
            if current_shipment_ids.count(current.id) == 0:
                current.delete()
        instance.shipments.set(shipment_instances)

        # DESTRUCTIONS
        # TODO put repeated code in a function
        destructions = validated_data.pop("destructions", [])
        destruction_instances = []
        current_destruction_ids = []
        for destruction_data in destructions:
            if destruction_data.get("id"):
                destruction_id = destruction_data["id"]
                current_destruction_ids.append(destruction_id)
                destruction = Destruction.objects.get(pk=destruction_id)
                if destruction.round != instance:
                    raise serializers.ValidationError({"destructions": "destruction is attached to wrong round"})
            else:
                destruction = Destruction.objects.create()
            destruction_serializer = DestructionSerializer(instance=destruction, data=destruction_data)
            destruction_serializer.is_valid(raise_exception=True)
            destruction_instance = destruction_serializer.save()
            destruction_instances.append(destruction_instance)
        # remove deleted destructions, ie existing destructions whose id wan't sent in the request
        all_current_destructions = instance.destructions.all()
        for current in all_current_destructions:
            if current_destruction_ids.count(current.id) == 0:
                current.delete()
        instance.destructions.set(destruction_instances)

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
class RoundViewSet(ModelViewSet):
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
