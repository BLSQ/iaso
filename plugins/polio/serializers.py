import logging
from datetime import datetime

import pandas as pd
from django.contrib.auth.models import User
from django.db import transaction
from django.db.models import Count
from django.db.transaction import atomic
from gspread.exceptions import APIError  # type: ignore
from gspread.exceptions import NoValidUrlKeyFound
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.utils.translation import gettext as _
from django.utils import timezone

from hat.audit.models import Modification, CAMPAIGN_API

from iaso.models import Group
from .models import (
    Round,
    LineListImport,
    VIRUSES,
    RoundVaccine,
    Shipment,
    SpreadSheetImport,
    CampaignGroup,
    BudgetEvent,
    BudgetFiles,
    RoundScope,
    CampaignScope,
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
        ref_name = "polio_user_serializer"


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


class BudgetEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetEvent
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at", "author"]
        ordering = ["type", "status", "updated_at"]

    def validate(self, attrs):
        validated_data = super().validate(attrs)
        return validated_data


class BudgetStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetEvent
        fields = ["created_at", "status", "type"]


# the following serializer are used so we can audit the modification on a campaign.
# The related Scope and Round can be modified in the same request but are modelised as separate ORM Object
# and DjangoSerializer don't serialize relation, DRF Serializer is used
class AuditRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = "__all__"


class AuditGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = "__all__"


class AuditCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = "__all__"

    group = AuditGroupSerializer()
    rounds = AuditRoundSerializer(many=True)


def serialize_campaign(campaign):
    "Serialize campaign for audit"
    return [AuditCampaignSerializer(campaign).data]


def log_campaign_modification(campaign: Campaign, old_campaign_dump, request_user):
    if not old_campaign_dump:
        old_campaign_dump = []
    Modification.objects.create(
        user=request_user,
        past_value=old_campaign_dump,
        new_value=serialize_campaign(campaign),
        content_object=campaign,
        source=CAMPAIGN_API,
    )


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
    name = serializers.CharField(default="hidden")

    class Meta:
        model = Group
        fields = ["name", "org_units", "id"]
        ref_name = "polio_group_serializer"


class RoundScopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundScope
        fields = ["group", "vaccine"]

    group = GroupSerializer()


class CampaignScopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignScope
        fields = ["group", "vaccine"]

    group = GroupSerializer()


class ShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = [
            "po_numbers",
            "doses_received",
            "estimated_arrival_date",
            "reception_pre_alert",
            "date_reception",
            "vaccine_name",
            "id",
        ]


class RoundVaccineSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundVaccine
        fields = ["wastage_ratio_forecast", "doses_per_vial", "name", "id"]


class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = "__all__"

    scopes = RoundScopeSerializer(many=True, required=False)
    vaccines = RoundVaccineSerializer(many=True, required=False)
    shipments = ShipmentSerializer(many=True, required=False)

    @atomic
    def create(self, validated_data):
        vaccines = validated_data.pop("vaccines", [])
        shipments = validated_data.pop("shipments", [])
        round = Round.objects.create(**validated_data)
        for vaccine in vaccines:
            RoundVaccine.objects.create(round=round, **vaccine)
        for shipment in shipments:
            Shipment.objects.create(round=round, **shipment)
        return round

    @atomic
    def update(self, instance, validated_data):
        vaccines = validated_data.pop("vaccines", [])
        vaccine_instances = []
        shipments = validated_data.pop("shipments", [])
        shipment_instances = []
        current_shipment_ids = []
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
        for shipment_data in shipments:
            shipment = None
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
        # remove deleted shipments, ie existing shipments whose id wan't sent in the request
        all_current_shipments = instance.shipments.all()
        for current in all_current_shipments:
            if current_shipment_ids.count(current.id) == 0:
                current.delete()
        instance.vaccines.set(vaccine_instances)
        instance.shipments.set(shipment_instances)
        round = super().update(instance, validated_data)
        return round


# Don't display the url for Anonymous users
class RoundAnonymousSerializer(RoundSerializer):
    class Meta:
        model = Round
        exclude = ["preparedness_spreadsheet_url"]


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
    try:
        round = campaign.rounds.get(number=roundNumber)
    except Round.DoesNotExist:
        return {"details": f"No round {roundNumber} on this campaign"}

    if not round.preparedness_spreadsheet_url:
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

    def __init__(self, *args, **kwargs):
        for field in kwargs.pop("hidden_fields", []):
            self.fields.pop(field)
        super().__init__(*args, **kwargs)

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
    round_number = serializers.IntegerField(required=False)
    url = serializers.URLField(read_only=True)

    def create(self, validated_data):
        campaign = validated_data.get("campaign")
        round_number = validated_data.get("round_number")

        spreadsheet = generate_spreadsheet_for_campaign(campaign, round_number)

        return {"url": spreadsheet.url}


class CampaignSerializer(serializers.ModelSerializer):
    round_one = serializers.SerializerMethodField(read_only=True)
    round_two = serializers.SerializerMethodField(read_only=True)

    def get_round_one(self, campaign):
        try:
            round = campaign.rounds.get(number=1)
            return RoundSerializer(round).data
        except Round.DoesNotExist:
            return None

    def get_round_two(self, campaign):
        try:
            round = campaign.rounds.get(number=2)
            return RoundSerializer(round).data
        except Round.DoesNotExist:
            return None

    rounds = RoundSerializer(many=True, required=False)
    org_unit = OrgUnitSerializer(source="initial_org_unit", read_only=True)
    top_level_org_unit_name = serializers.SlugRelatedField(source="country", slug_field="name", read_only=True)
    top_level_org_unit_id = serializers.SlugRelatedField(source="country", slug_field="id", read_only=True)
    general_status = serializers.SerializerMethodField()
    grouped_campaigns = serializers.PrimaryKeyRelatedField(
        many=True, queryset=CampaignGroup.objects.all(), required=False
    )
    last_budget_event = BudgetStatusSerializer(many=False, required=False, allow_null=True)

    def get_top_level_org_unit_name(self, campaign):
        if campaign.country:
            return campaign.country.name
        return ""

    def get_top_level_org_unit_id(self, campaign):
        if campaign.country:
            return campaign.country.id
        return ""

    def get_general_status(self, campaign):
        now_utc = timezone.now().date()
        for round in campaign.rounds.all().order_by("-number"):
            if round.ended_at and now_utc > round.ended_at:
                return _("Round {} ended").format(round.number)
            elif round.started_at and now_utc >= round.started_at:
                return _("Round {} started").format(round.number)
        return _("Preparing")

    # group = GroupSerializer(required=False, allow_null=True)
    scopes = CampaignScopeSerializer(many=True, required=False)

    last_surge = SurgeSerializer(
        required=False,
        read_only=True,
        allow_null=True,
    )

    obr_name = serializers.CharField(validators=[UniqueValidator(queryset=Campaign.objects.all())])

    @atomic
    def create(self, validated_data):
        grouped_campaigns = validated_data.pop("grouped_campaigns", [])
        rounds = validated_data.pop("rounds", [])

        campaign_scopes = validated_data.pop("scopes", [])
        campaign = Campaign.objects.create(
            **validated_data,
        )

        campaign.grouped_campaigns.set(grouped_campaigns)

        for scope in campaign_scopes:
            vaccine = scope.get("vaccine")
            org_units = scope.get("group", {}).get("org_units")
            scope, created = campaign.scopes.get_or_create(vaccine=vaccine)
            if not scope.group:
                scope.group = Group.objects.create(name="hidden roundScope")
            scope.group.org_units.set(org_units)

        for round_data in rounds:
            scopes = round_data.pop("scopes", [])
            round = Round.objects.create(campaign=campaign, **round_data)
            for scope in scopes:
                vaccine = scope.get("vaccine")
                org_units = scope.get("group", {}).get("org_units")
                scope, created = round.scopes.get_or_create(vaccine=vaccine)
                if not scope.group:
                    scope.group = Group.objects.create(name="hidden roundScope")
                scope.group.org_units.set(org_units)

        log_campaign_modification(campaign, None, self.context["request"].user)
        return campaign

    @atomic
    def update(self, instance: Campaign, validated_data):
        old_campaign_dump = serialize_campaign(instance)
        rounds = validated_data.pop("rounds", [])
        campaign_scopes = validated_data.pop("scopes", [])
        for scope in campaign_scopes:
            vaccine = scope.get("vaccine")
            org_units = scope.get("group", {}).get("org_units")
            scope, created = instance.scopes.get_or_create(vaccine=vaccine)
            if not scope.group:
                scope.group = Group.objects.create(name="hidden roundScope")
            scope.group.org_units.set(org_units)

        round_instances = []
        # find existing round either by id or number
        for round_data in rounds:
            round = None
            if round_data.get("id"):
                round_id = round_data["id"]
                round = Round.objects.get(pk=round_id)
                if round.campaign != instance:
                    raise serializers.ValidationError({"rounds": "round is attached to a different campaign"})
            elif round_data.get("number"):
                try:
                    round = instance.rounds.get(number=round_data.get("number"))
                except Round.DoesNotExist:
                    pass
            # we pop the campaign since we use the set afterward which will also remove the deleted one
            round_data.pop("campaign", None)
            scopes = round_data.pop("scopes", [])
            round_serializer = RoundSerializer(instance=round, data=round_data)
            round_serializer.is_valid(raise_exception=True)
            round_instance = round_serializer.save()
            round_instances.append(round_instance)
            for scope in scopes:
                vaccine = scope.get("vaccine")
                org_units = scope.get("group", {}).get("org_units")
                scope, created = round_instance.scopes.get_or_create(vaccine=vaccine)
                if not scope.group:
                    scope.group = Group.objects.create(name="hidden roundScope")
                scope.group.org_units.set(org_units)
        instance.rounds.set(round_instances)

        validated_data.pop("last_budget_event", None)
        campaign = super().update(instance, validated_data)

        log_campaign_modification(campaign, old_campaign_dump, self.context["request"].user)
        return campaign

    # Vaccines with real scope
    vaccines = serializers.CharField(read_only=True)

    class Meta:
        model = Campaign
        fields = "__all__"
        read_only_fields = ["last_surge", "preperadness_sync_status", "creation_email_send_at", "group"]


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
            # "group",
            "onset_at",
            "three_level_call_at",
            "cvdpv_notified_at",
            "cvdpv2_notified_at",
            "pv_notified_at",
            "pv2_notified_at",
            "virus",
            "vaccines",
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
    rounds = RoundAnonymousSerializer(many=True)
    round_one = serializers.SerializerMethodField(read_only=True)
    round_two = serializers.SerializerMethodField(read_only=True)

    def get_round_one(self, campaign):
        try:
            round = campaign.rounds.get(number=1)
            return RoundAnonymousSerializer(round).data
        except Round.DoesNotExist:
            return None

    def get_round_two(self, campaign):
        try:
            round = campaign.rounds.get(number=2)
            return RoundAnonymousSerializer(round).data
        except Round.DoesNotExist:
            return None

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
            # "group",
            "onset_at",
            "three_level_call_at",
            "cvdpv_notified_at",
            "cvdpv2_notified_at",
            "pv_notified_at",
            "pv2_notified_at",
            "virus",
            "scopes",
            "vaccines",
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
            "rounds",
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


class CampaignNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = ["id", "obr_name"]


class CampaignGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignGroup
        fields = "__all__"

    campaigns = CampaignNameSerializer(many=True, read_only=True)
    campaigns_ids = serializers.PrimaryKeyRelatedField(many=True, queryset=Campaign.objects.all(), source="campaigns")


class BudgetFilesSerializer(serializers.ModelSerializer):
    class Meta:
        model = BudgetFiles
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]
