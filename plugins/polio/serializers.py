from plugins.polio.preparedness.calculator import get_preparedness_score
from django.db.models import fields
from django.db.transaction import atomic
from rest_framework import serializers
from iaso.models import Group, OrgUnit
from .models import Preparedness, Round, Campaign, Surge
from .preparedness.parser import (
    open_sheet_by_url,
    get_regional_level_preparedness,
    get_national_level_preparedness,
    InvalidFormatError,
    parse_value,
)
from gspread.exceptions import APIError


class GroupSerializer(serializers.ModelSerializer):
    org_units = serializers.PrimaryKeyRelatedField(many=True, allow_empty=True, queryset=OrgUnit.objects.all())

    class Meta:
        model = Group
        fields = ["name", "org_units"]


class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = "__all__"


class PreparednessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Preparedness
        exclude = ["campaign"]
        extra_kwargs = {"payload": {"write_only": True}}


class SurgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Surge
        exclude = ["campaign"]
        extra_kwargs = {"payload": {"write_only": True}}


class PreparednessPreviewSerializer(serializers.Serializer):
    google_sheet_url = serializers.URLField()

    def validate(self, attrs):
        try:
            sheet = open_sheet_by_url(attrs.get("google_sheet_url"))
            response = {
                "national": get_national_level_preparedness(sheet),
                **get_regional_level_preparedness(sheet),
            }
            response["totals"] = get_preparedness_score(response)
            return response
        except InvalidFormatError as e:
            raise serializers.ValidationError(e.args[0])
        except APIError as e:
            raise serializers.ValidationError(e.args[0].get("message"))

    def to_representation(self, instance):
        return instance


class SurgePreviewSerializer(serializers.Serializer):
    google_sheet_url = serializers.URLField()
    surge_country_name = serializers.CharField(max_length=200)

    def validate(self, attrs):
        try:
            surge_country_name = attrs.get("surge_country_name")
            sheet = open_sheet_by_url(attrs.get("google_sheet_url")).worksheets()[0]

            cell = sheet.find(surge_country_name)

            first_row = cell.row
            first_col = cell.col + 1
            last_row = cell.row
            last_col = cell.col + 8

            data = sheet.range(first_row, first_col, last_row, last_col)

            [
                who_recruitment,
                who_completed_recruitment,
                _,
                _,
                unicef_recruitment,
                unicef_completed_recruitment,
                _,
                _,
            ] = data

            response = {
                "who_recruitment": parse_value(who_recruitment.value),
                "who_completed_recruitment": parse_value(who_completed_recruitment.value),
                "unicef_recruitment": parse_value(unicef_recruitment.value),
                "unicef_completed_recruitment": parse_value(unicef_completed_recruitment.value),
            }
            return response
        except InvalidFormatError as e:
            raise serializers.ValidationError(e.args[0])
        except APIError as e:
            raise serializers.ValidationError(e.args[0].get("message"))

    def to_representation(self, instance):
        return instance


class CampaignSerializer(serializers.ModelSerializer):
    round_one = RoundSerializer()
    round_two = RoundSerializer()

    top_level_org_unit_name = serializers.SerializerMethodField()

    def get_top_level_org_unit_name(self, campaign):
        if campaign.initial_org_unit:
            return campaign.initial_org_unit.name
        return ""

    group = GroupSerializer(required=False, allow_null=True)

    preparedness_data = PreparednessSerializer(required=False)
    last_preparedness = PreparednessSerializer(
        required=False,
        read_only=True,
        allow_null=True,
    )
    surge_data = SurgeSerializer(required=False)
    last_surge = SurgeSerializer(
        required=False,
        read_only=True,
        allow_null=True,
    )

    @atomic
    def create(self, validated_data):
        round_one_data = validated_data.pop("round_one")
        round_two_data = validated_data.pop("round_two")

        group = validated_data.pop("group") if "group" in validated_data else None

        if group:
            org_units = group.pop("org_units") if "org_units" in group else []
            campaign_group = Group.objects.create(**group)
            campaign_group.org_units.set(OrgUnit.objects.filter(pk__in=map(lambda org_unit: org_unit.id, org_units)))
        else:
            campaign_group = None

        preparedness_data = validated_data.pop("preparedness_data", None)
        surge_data = validated_data.pop("surge_data", None)
        campaign = Campaign.objects.create(
            **validated_data,
            round_one=Round.objects.create(**round_one_data),
            round_two=Round.objects.create(**round_two_data),
            group=campaign_group,
        )

        if preparedness_data is not None:
            Preparedness.objects.create(campaign=campaign, **preparedness_data)
        if surge_data is not None:
            Surge.objects.create(campaign=campaign, **surge_data)

        return campaign

    @atomic
    def update(self, instance, validated_data):
        round_one_data = validated_data.pop("round_one")
        round_two_data = validated_data.pop("round_two")
        group = validated_data.pop("group") if "group" in validated_data else None

        Round.objects.filter(pk=instance.round_one_id).update(**round_one_data)
        Round.objects.filter(pk=instance.round_two_id).update(**round_two_data)

        if group:
            org_units = group.pop("org_units") if "org_units" in group else []
            campaign_group, created = Group.objects.get_or_create(pk=instance.group_id, defaults={**group})
            campaign_group.org_units.set(OrgUnit.objects.filter(pk__in=map(lambda org_unit: org_unit.id, org_units)))
            instance.group = campaign_group

        if "preparedness_data" in validated_data:
            Preparedness.objects.create(campaign=instance, **validated_data.pop("preparedness_data"))
        if "surge_data" in validated_data:
            Surge.objects.create(campaign=instance, **validated_data.pop("surge_data"))
        return super().update(instance, validated_data)

    class Meta:
        model = Campaign
        fields = "__all__"
        read_only_fields = ["last_preparedness", "last_surge"]
        extra_kwargs = {"preparedness_data": {"write_only": True}}
