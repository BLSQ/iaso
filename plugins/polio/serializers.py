import logging
from datetime import datetime, timezone

import pandas as pd
from django.contrib.auth.models import User
from django.db import transaction
from django.db.transaction import atomic
from django.utils.translation import gettext_lazy as _
from gspread.exceptions import APIError
from rest_framework import exceptions
from rest_framework import serializers

from iaso.models import Group, OrgUnit
from plugins.polio.preparedness.calculator import get_preparedness_score
from .models import Preparedness, Round, Campaign, Surge, CountryUsersGroup, LineListImport, VIRUSES
from .preparedness.parser import (
    open_sheet_by_url,
    get_regional_level_preparedness,
    get_national_level_preparedness,
    InvalidFormatError,
    parse_value,
)
from .preparedness.spreadsheet_manager import *
from logging import getLogger

logger = getLogger(__name__)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "first_name", "last_name", "email"]


class CountryUsersGroupSerializer(serializers.ModelSerializer):
    read_only_users_field = UserSerializer(source="users", many=True, read_only=True)
    country_name = serializers.SlugRelatedField(source="country", slug_field="name", read_only=True)

    class Meta:
        model = CountryUsersGroup
        read_only_fields = ["id", "country", "created_at", "updated_at", "read_only_users_field"]
        fields = [
            "id",
            "country",
            "language",
            "created_at",
            "updated_at",
            "country_name",
            "users",
            "read_only_users_field",
        ]


def _error(message, exc=None):
    errors = {"file": [message]}
    if exc:
        errors["debug"]: [str(exc)]
    return errors


@transaction.atomic
def campaign_from_files(file):
    try:
        df = pd.read_excel(file)
    except Exception as exc:
        print(exc)
        raise serializers.ValidationError(_error("Invalid Excel file", exc))
    mapping = {"EPID Number": "epid", "VDPV Category": "virus", "Onset Date": "onset_at"}
    for key in mapping.keys():
        if key not in df.columns:
            raise serializers.ValidationError(_error(f"Missing column {key}"))
    known_viruses = [v[0] for v in VIRUSES]
    created_campaigns = []
    skipped_campaigns = []

    for ind in df.index:
        epid = df["EPID Number"][ind]
        if not epid:
            break
        onset_date = df["Onset Date"][ind]
        virus = df["VDPV Category"][ind]
        print(epid, onset_date, type(onset_date), virus)
        c, created = Campaign.objects.get_or_create(epid=epid)
        if not created:
            skipped_campaigns.append(epid)
            print("Skipping existing campaign {c.epid}")
            continue

        c.obr_name = epid
        if virus in known_viruses:
            c.virus = virus
        else:
            raise serializers.ValidationError(_error(f"wrong format for virus on line {ind}"))
        if isinstance(onset_date, datetime):
            print(onset_date, type(onset_date))
            c.onset_at = onset_date
        else:
            raise serializers.ValidationError(_error(f"wrong format for onset_date on line {ind}"))

        created_campaigns.append({"id": str(c.id), "epid": c.epid})
        c.save()

    res = {"created": len(created_campaigns), "campaigns": created_campaigns, "skipped_campaigns": skipped_campaigns}
    print(res)
    return res


class LineListImportSerializer(serializers.ModelSerializer):
    class Meta:
        model = LineListImport
        fields = ["file", "import_result", "created_by", "created_at"]
        read_only_fields = ["import_result", "created_by", "created_at"]

    def create(self, validated_data):
        line_list_import = LineListImport(
            file=validated_data.get("file"),
            import_result="pending",
            created_by=self.context["request"].user,
        )

        line_list_import.save()

        # Tentatively created campaign, will transaction.abort in case of error
        res = "importing"
        try:
            res = campaign_from_files(line_list_import.file)
        except Exception as exc:
            logging.exception(exc)
            if isinstance(exc, serializers.ValidationError):
                res = {"error": exc.get_full_details()}
            else:
                res = {"error": str(exc)}
            line_list_import.import_result = res
            line_list_import.save()
            raise

        line_list_import.import_result = res
        line_list_import.save()
        return line_list_import


class GroupSerializer(serializers.ModelSerializer):
    org_units = serializers.PrimaryKeyRelatedField(
        many=True, allow_empty=True, queryset=OrgUnit.objects.all(), style={"base_template": "input.html"}
    )

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


class OrgUnitSerializer(serializers.ModelSerializer):
    country_parent = serializers.SerializerMethodField()
    root = serializers.SerializerMethodField()

    def __init__(self, **kwargs):
        for field in kwargs.pop("hidden_fields", []):
            self.fields.pop(field)
        super().__init__(**kwargs)

    def get_country_parent(self, instance: OrgUnit):
        countries = instance.country_ancestors()
        if countries is not None and len(countries) > 0:
            country = countries[0]
            return OrgUnitSerializer(instance=country, hidden_fields=["country_parent", "root"]).data

    def get_root(self, instance: OrgUnit):
        root = instance.root()
        return OrgUnitSerializer(instance=root, hidden_fields=["country_parent", "root"]).data if root else None

    class Meta:
        model = OrgUnit
        fields = ["id", "name", "root", "country_parent"]


class CampaignPreparednessSpreadsheetSerializer(serializers.Serializer):
    campaign = serializers.PrimaryKeyRelatedField(queryset=Campaign.objects.all(), write_only=True)
    url = serializers.URLField(read_only=True)

    def validate(self, attrs):
        if not PREPAREDNESS_TEMPLATE_ID:
            raise exceptions.ValidationError({"message": _("Preparedness template not configured")})
        return attrs

    def create(self, validated_data):
        campaign = validated_data.get("campaign")

        lang = "EN"
        try:
            country = campaign.country()
            cug = CountryUsersGroup.objects.get(country=country)
            lang = cug.language
        except Exception as e:
            logger.exception(e)
            logger.error(f"Could not find template language for {campaign}")
        spreadsheet = create_spreadsheet(campaign.obr_name, lang)

        update_national_worksheet(
            spreadsheet.worksheet("National"),
            vacine=campaign.vacine,
            payment_mode=campaign.payment_mode,
            country=campaign.country(),
        )

        regional_template_worksheet = spreadsheet.worksheet("Regional")

        districts = campaign.get_districts()
        regions = campaign.get_regions()
        current_index = 2
        for index, region in enumerate(regions):
            regional_worksheet = regional_template_worksheet.duplicate(current_index, None, region.name)
            region_districts = districts.filter(parent=region)
            update_regional_worksheet(regional_worksheet, region.name, region_districts)
            current_index += 1

        spreadsheet.del_worksheet(regional_template_worksheet)

        return {"url": spreadsheet.url}


class CampaignSerializer(serializers.ModelSerializer):
    round_one = RoundSerializer()
    round_two = RoundSerializer()
    org_unit = OrgUnitSerializer(source="initial_org_unit", read_only=True)
    top_level_org_unit_name = serializers.SerializerMethodField()
    general_status = serializers.SerializerMethodField()

    def get_top_level_org_unit_name(self, campaign):
        if campaign.initial_org_unit:
            parent = campaign.initial_org_unit
            while parent.parent:
                parent = parent.parent
            return parent.name
        return ""

    def get_general_status(self, campaign):
        now_utc = datetime.now(timezone.utc).date()
        if campaign.round_two:
            if campaign.round_two.ended_at and now_utc > campaign.round_two.ended_at:
                return _("Round 2 completed")
            if campaign.round_two.started_at and now_utc >= campaign.round_two.started_at:
                return _("Round 2 started")
        if campaign.round_one:
            if campaign.round_one.ended_at and now_utc > campaign.round_one.ended_at:
                return _("Round 1 completed")
            if campaign.round_one.started_at and now_utc >= campaign.round_one.started_at:
                return _("Round 1 started")

        return _("Preparing")

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
            campaign_group = Group.domain_objects.create(**group, domain="POLIO")
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
            campaign_group, created = Group.domain_objects.get_or_create(
                pk=instance.group_id, defaults={**group, "domain": "POLIO"}
            )
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
        read_only_fields = ["last_preparedness", "last_surge", "preperadness_sync_status"]
        extra_kwargs = {"preparedness_data": {"write_only": True}}
