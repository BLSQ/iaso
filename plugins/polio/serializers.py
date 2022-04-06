import logging
from datetime import datetime, timezone

import pandas as pd
from django.contrib.auth.models import User
from django.db import transaction
from django.db.transaction import atomic
from gspread.exceptions import APIError
from gspread.exceptions import NoValidUrlKeyFound
from rest_framework import serializers
from rest_framework.validators import UniqueValidator

from iaso.models import Group, OrgUnit
from .models import (
    Preparedness,
    Round,
    LineListImport,
    VIRUSES,
    PREPARING,
    ROUND1START,
    ROUND1DONE,
    ROUND2START,
    ROUND2DONE,
    SpreadSheetImport,
    CampaignGroup,
)
from .preparedness.calculator import get_preparedness_score, preparedness_summary
from .preparedness.parser import (
    InvalidFormatError,
    get_preparedness,
    surge_indicator_for_country,
)
from .preparedness.spreadsheet_manager import *
from .preparedness.spreadsheet_manager import generate_spreadsheet_for_campaign

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
        errors["debug"] = [str(exc)]
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
            print(f"Skipping existing campaign {c.epid}")
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
        fields = ["name", "org_units", "id"]


class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = "__all__"


# Don't display the url for Anonymous users
class RoundAnonymousSerializer(RoundSerializer):
    class Meta:
        model = Round
        exclude = ["preparedness_spreadsheet_url"]


class PreparednessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Preparedness
        exclude = ["spreadsheet_url"]


class SurgeSerializer(serializers.Serializer):
    created_at = serializers.DateTimeField()
    # surge_country_name = serializers.CharField()
    title = serializers.CharField()  # title of the Google spreadsheet
    who_recruitment = serializers.IntegerField()
    who_completed_recruitment = serializers.IntegerField()
    unicef_recruitment = serializers.IntegerField()
    unicef_completed_recruitment = serializers.IntegerField()


def preparedness_from_url(spreadsheet_url, force_refresh=False):
    try:
        if force_refresh:
            ssi = SpreadSheetImport.create_for_url(spreadsheet_url)
        else:
            ssi = SpreadSheetImport.last_for_url(spreadsheet_url)
        if not ssi:
            return {}

        cs = ssi.cached_spreadsheet
        r = {}
        preparedness_data = get_preparedness(cs)
        r.update(preparedness_data)
        r["title"] = cs.title
        r["created_at"] = ssi.created_at
        r.update(get_preparedness_score(preparedness_data))
        r.update(preparedness_summary(preparedness_data))
        return r
    except InvalidFormatError as e:
        raise serializers.ValidationError(e.args[0])
    except APIError as e:
        raise serializers.ValidationError(e.args[0].get("message"))


def get_current_preparedness(campaign, roundNumber):
    if roundNumber == "round_one":
        round = campaign.round_one
    elif roundNumber == "round_two":
        round = campaign.round_two
    else:
        raise serializers.ValidationError("Invalid round")
    if not (round and round.preparedness_spreadsheet_url):
        return {}
    spreadsheet_url = round.preparedness_spreadsheet_url
    return preparedness_from_url(spreadsheet_url)


class PreparednessPreviewSerializer(serializers.Serializer):
    google_sheet_url = serializers.URLField()

    def validate(self, attrs):
        spreadsheet_url = attrs.get("google_sheet_url")
        return preparedness_from_url(spreadsheet_url, force_refresh=True)

    def to_representation(self, instance):
        return instance


class SurgePreviewSerializer(serializers.Serializer):
    surge_spreadsheet_url = serializers.URLField()
    country_name_in_surge_spreadsheet = serializers.CharField(max_length=200)

    def validate(self, attrs):
        try:
            spreadsheet_url = attrs.get("surge_spreadsheet_url")
            surge_country_name = attrs.get("country_name_in_surge_spreadsheet")

            ssi = SpreadSheetImport.create_for_url(spreadsheet_url)
            cs = ssi.cached_spreadsheet

            response = surge_indicator_for_country(cs, surge_country_name)
            response["created_at"] = ssi.created_at
            return response
        except InvalidFormatError as e:
            raise serializers.ValidationError(e.args[0])
        except APIError as e:
            raise serializers.ValidationError(e.args[0].get("message"))
        except NoValidUrlKeyFound as e:
            raise serializers.ValidationError({"surge_spreadsheet_url": ["Invalid URL"]})
        except Exception as e:
            raise serializers.ValidationError(f"{type(e)}: {str(e)}")

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
    """Serializer used to CREATE Preparedness spreadsheet from template"""

    campaign = serializers.PrimaryKeyRelatedField(queryset=Campaign.objects.all(), write_only=True)
    url = serializers.URLField(read_only=True)

    def create(self, validated_data):
        campaign = validated_data.get("campaign")

        spreadsheet = generate_spreadsheet_for_campaign(campaign)

        return {"url": spreadsheet.url}


class CampaignSerializer(serializers.ModelSerializer):
    round_one = RoundSerializer()
    round_two = RoundSerializer()
    org_unit = OrgUnitSerializer(source="initial_org_unit", read_only=True)
    top_level_org_unit_name = serializers.SlugRelatedField(source="country", slug_field="name", read_only=True)
    top_level_org_unit_id = serializers.SlugRelatedField(source="country", slug_field="id", read_only=True)
    general_status = serializers.SerializerMethodField()
    groups = serializers.PrimaryKeyRelatedField(many=True, queryset=CampaignGroup.objects.all())

    def get_top_level_org_unit_name(self, campaign):
        if campaign.country:
            return campaign.country.name
        return ""

    def get_top_level_org_unit_id(self, campaign):
        if campaign.country:
            return campaign.country.id
        return ""

    def get_general_status(self, campaign):
        now_utc = datetime.now(timezone.utc).date()
        if campaign.round_two:
            if campaign.round_two.ended_at and now_utc > campaign.round_two.ended_at:
                return ROUND2DONE
            if campaign.round_two.started_at and now_utc >= campaign.round_two.started_at:
                return ROUND2START
        if campaign.round_one:
            if campaign.round_one.ended_at and now_utc > campaign.round_one.ended_at:
                return ROUND1DONE
            if campaign.round_one.started_at and now_utc >= campaign.round_one.started_at:
                return ROUND1START

        return PREPARING

    group = GroupSerializer(required=False, allow_null=True)

    last_surge = SurgeSerializer(
        required=False,
        read_only=True,
        allow_null=True,
    )

    obr_name = serializers.CharField(validators=[UniqueValidator(queryset=Campaign.objects.all())])

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

        campaign = Campaign.objects.create(
            **validated_data,
            round_one=Round.objects.create(**round_one_data),
            round_two=Round.objects.create(**round_two_data),
            group=campaign_group,
        )

        return campaign

    @atomic
    def update(self, instance, validated_data):
        round_one_data = validated_data.pop("round_one")
        round_two_data = validated_data.pop("round_two")
        group = validated_data.pop("group") if "group" in validated_data else None

        round_one_serializer = RoundSerializer(instance=instance.round_one, data=round_one_data)
        round_one_serializer.is_valid(raise_exception=True)
        instance.round_one = round_one_serializer.save()

        round_two_serializer = RoundSerializer(instance=instance.round_two, data=round_two_data)
        round_two_serializer.is_valid(raise_exception=True)
        instance.round_two = round_two_serializer.save()

        if group:
            org_units = group.pop("org_units") if "org_units" in group else []
            campaign_group, created = Group.domain_objects.get_or_create(
                pk=instance.group_id, defaults={**group, "domain": "POLIO"}
            )
            campaign_group.org_units.set(OrgUnit.objects.filter(pk__in=map(lambda org_unit: org_unit.id, org_units)))
            instance.group = campaign_group

        return super().update(instance, validated_data)

    class Meta:
        model = Campaign
        fields = "__all__"
        read_only_fields = ["last_surge", "preperadness_sync_status", "creation_email_send_at"]


class SmallCampaignSerializer(CampaignSerializer):
    class Meta:
        model = Campaign
        fields = [
            "id",
            "epid",
            "obr_name",
            "gpei_coordinator",
            "gpei_email",
            "description",
            "initial_org_unit",
            "creation_email_send_at",
            "group",
            "onset_at",
            "three_level_call_at",
            "cvdpv_notified_at",
            "cvdpv2_notified_at",
            "pv_notified_at",
            "pv2_notified_at",
            "virus",
            "vacine",
            "detection_status",
            "detection_responsible",
            "detection_first_draft_submitted_at",
            "detection_rrt_oprtt_approval_at",
            "risk_assessment_status",
            "risk_assessment_responsible",
            "investigation_at",
            "risk_assessment_first_draft_submitted_at",
            "risk_assessment_rrt_oprtt_approval_at",
            "ag_nopv_group_met_at",
            "dg_authorized_at",
            "verification_score",
            "doses_requested",
            "country_name_in_surge_spreadsheet",
            "budget_status",
            "budget_responsible",
            "who_disbursed_to_co_at",
            "who_disbursed_to_moh_at",
            "unicef_disbursed_to_co_at",
            "unicef_disbursed_to_moh_at",
            "eomg",
            "no_regret_fund_amount",
            "payment_mode",
            # "round_one",
            # "round_two",
            "created_at",
            "updated_at",
            "district_count",
            "budget_rrt_oprtt_approval_at",
            "budget_submitted_at",
            "top_level_org_unit_name",
            "top_level_org_unit_id",
            "is_preventive",
        ]
        read_only_fields = fields


class AnonymousCampaignSerializer(CampaignSerializer):
    round_one = RoundAnonymousSerializer()
    round_two = RoundAnonymousSerializer()

    class Meta:
        model = Campaign
        fields = [
            "id",
            "epid",
            "obr_name",
            "gpei_coordinator",
            "gpei_email",
            "description",
            "initial_org_unit",
            "creation_email_send_at",
            "group",
            "onset_at",
            "three_level_call_at",
            "cvdpv_notified_at",
            "cvdpv2_notified_at",
            "pv_notified_at",
            "pv2_notified_at",
            "virus",
            "vacine",
            "detection_status",
            "detection_responsible",
            "detection_first_draft_submitted_at",
            "detection_rrt_oprtt_approval_at",
            "risk_assessment_status",
            "risk_assessment_responsible",
            "investigation_at",
            "risk_assessment_first_draft_submitted_at",
            "risk_assessment_rrt_oprtt_approval_at",
            "ag_nopv_group_met_at",
            "dg_authorized_at",
            "verification_score",
            "doses_requested",
            "country_name_in_surge_spreadsheet",
            "budget_status",
            "budget_responsible",
            "who_disbursed_to_co_at",
            "who_disbursed_to_moh_at",
            "unicef_disbursed_to_co_at",
            "unicef_disbursed_to_moh_at",
            "eomg",
            "no_regret_fund_amount",
            "payment_mode",
            "round_one",
            "round_two",
            "created_at",
            "updated_at",
            "district_count",
            "budget_rrt_oprtt_approval_at",
            "budget_submitted_at",
            "top_level_org_unit_name",
            "top_level_org_unit_id",
            "is_preventive",
        ]
        read_only_fields = fields


class CampaignGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignGroup
        fields = "__all__"
