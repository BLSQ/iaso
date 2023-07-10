import logging
from datetime import datetime

import pandas as pd
from django.db import transaction
from django.db.transaction import atomic
from django.utils import timezone
from django.utils.translation import gettext as _
from gspread.exceptions import APIError  # type: ignore
from gspread.exceptions import NoValidUrlKeyFound
from rest_framework import serializers
from rest_framework.fields import Field
from rest_framework.validators import UniqueValidator

from hat.audit.models import Modification, CAMPAIGN_API
from iaso.api.common import UserSerializer
from iaso.models import Group
from .models import (
    Config,
    Round,
    LineListImport,
    VIRUSES,
    RoundDateHistoryEntry,
    RoundVaccine,
    Shipment,
    Destruction,
    SpreadSheetImport,
    CampaignGroup,
    RoundScope,
    CampaignScope,
)
from .preparedness.calculator import get_preparedness_score
from .preparedness.parser import (
    InvalidFormatError,
    get_preparedness,
    surge_indicator_for_country,
)
from .preparedness.spreadsheet_manager import *
from .preparedness.spreadsheet_manager import generate_spreadsheet_for_campaign
from .preparedness.summary import preparedness_summary, set_preparedness_cache_for_round

logger = getLogger(__name__)


class UserSerializerForPolio(UserSerializer):
    class Meta(UserSerializer.Meta):
        fields = ["id", "username", "first_name", "last_name", "email"]
        ref_name = "polio_user_serializer"


class CountryUsersGroupSerializer(serializers.ModelSerializer):
    read_only_users_field = UserSerializerForPolio(source="users", many=True, read_only=True)
    country_name: Field = serializers.SlugRelatedField(source="country", slug_field="name", read_only=True)

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
            "teams",
        ]


def _error(message, exc=None):
    errors = {"file": [message]}
    if exc:
        errors["debug"] = [str(exc)]
    return errors


# the following serializer are used, so we can audit the modification on a campaign.
# The related Scope and Round can be modified in the same request but are modelised as separate ORM Object
# and DjangoSerializer don't serialize relation, DRF Serializer is used
class AuditGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = "__all__"


class AuditRoundVaccineSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundVaccine
        fields = "__all__"


class AuditShipmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Shipment
        fields = "__all__"


class AuditDestructionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destruction
        fields = "__all__"


class AuditRoundScopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundScope
        fields = "__all__"

    group = AuditGroupSerializer()


class AuditRoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = "__all__"

    vaccines = AuditRoundVaccineSerializer(many=True)
    scopes = AuditRoundScopeSerializer(many=True)
    shipments = AuditShipmentSerializer(many=True)
    destructions = AuditDestructionSerializer(many=True)


class AuditCampaignScopeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampaignScope
        fields = "__all__"

    group = AuditGroupSerializer()


class AuditCampaignSerializer(serializers.ModelSerializer):
    class Meta:
        model = Campaign
        fields = "__all__"

    group = AuditGroupSerializer()
    rounds = AuditRoundSerializer(many=True)
    scopes = AuditCampaignScopeSerializer(many=True)


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
def campaign_from_files(file, account):
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
        c, created = Campaign.objects.get_or_create(epid=epid, account=account)
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
        account = self.context["request"].user.iaso_profile.account
        line_list_import = LineListImport(
            file=validated_data.get("file"),
            import_result="pending",
            created_by=self.context["request"].user,
        )

        line_list_import.save()

        # Tentatively created campaign, will transaction.abort in case of error
        try:
            res = campaign_from_files(line_list_import.file, account)
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


class DestructionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Destruction
        fields = [
            "vials_destroyed",
            "date_report_received",
            "date_report",
            "comment",
            "id",
        ]


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


class RoundVaccineSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundVaccine
        fields = ["wastage_ratio_forecast", "doses_per_vial", "name", "id"]


class RoundDateHistoryEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = RoundDateHistoryEntry
        fields = [
            "created_at",
            "reason",
            "ended_at",
            "started_at",
            "round",
            "previous_ended_at",
            "previous_started_at",
            "modified_by",
        ]

    modified_by = UserSerializer(required=False, read_only=True)

    def validate(self, data):
        if not data["reason"]:
            raise serializers.ValidationError("No reason provided")
        start_date = data["started_at"]
        end_date = data["ended_at"]
        start_date_changed = start_date != data["previous_started_at"]
        end_date_changed = start_date != data["previous_ended_at"]
        if start_date and end_date and end_date < start_date:
            raise serializers.ValidationError("End date should be after start date")
        if not start_date_changed and not end_date_changed:
            raise serializers.ValidationError("No date was modified")
        return super().validate(data)


class RoundSerializer(serializers.ModelSerializer):
    class Meta:
        model = Round
        fields = "__all__"

    scopes = RoundScopeSerializer(many=True, required=False)
    vaccines = RoundVaccineSerializer(many=True, required=False)
    shipments = ShipmentSerializer(many=True, required=False)
    destructions = DestructionSerializer(many=True, required=False)
    datelogs = RoundDateHistoryEntrySerializer(many=True, required=False)
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
        round = Round.objects.create(**validated_data)
        if started_at is not None or ended_at is not None:
            datelog = RoundDateHistoryEntry.objects.create(round=round, reason="INITIAL_DATA", modified_by=user)
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
        except NoValidUrlKeyFound:
            raise serializers.ValidationError({"surge_spreadsheet_url": ["Invalid URL"]})
        except Exception as e:
            raise serializers.ValidationError(f"{type(e)}: {str(e)}")

    def to_representation(self, instance):
        return instance


class OrgUnitSerializer(serializers.ModelSerializer):
    country_parent = serializers.SerializerMethodField()
    root = serializers.SerializerMethodField()  # type: ignore

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


class CurrentAccountDefault:
    """
    May be applied as a `default=...` value on a serializer field.
    Returns the current user's account.
    """

    requires_context = True

    def __call__(self, serializer_field):
        return serializer_field.context["request"].user.iaso_profile.account_id


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
    org_unit: Field = OrgUnitSerializer(source="initial_org_unit", read_only=True)
    top_level_org_unit_name: Field = serializers.SlugRelatedField(source="country", slug_field="name", read_only=True)
    top_level_org_unit_id: Field = serializers.SlugRelatedField(source="country", slug_field="id", read_only=True)
    general_status = serializers.SerializerMethodField()
    grouped_campaigns = serializers.PrimaryKeyRelatedField(
        many=True, queryset=CampaignGroup.objects.all(), required=False
    )
    # Account is filed per default the one of the connected user that update it
    account: Field = serializers.PrimaryKeyRelatedField(default=CurrentAccountDefault(), read_only=True)
    has_data_in_budget_tool = serializers.SerializerMethodField(read_only=True)

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

    def get_has_data_in_budget_tool(self, campaign):
        return campaign.budget_steps.count() > 0

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
            # there seems a bug in DRF the account is not in validated data, when not using HiddenField
            account_id=self.context["request"].user.iaso_profile.account_id,
            **validated_data,
        )

        campaign.grouped_campaigns.set(grouped_campaigns)

        # noinspection DuplicatedCode
        for scope in campaign_scopes:
            vaccine = scope.get("vaccine")
            org_units = scope.get("group", {}).get("org_units")
            scope, created = campaign.scopes.get_or_create(vaccine=vaccine)
            source_version_id = None
            name = f"scope for campaign {campaign.obr_name} - {vaccine}"
            if org_units:
                source_version_ids = set([ou.version_id for ou in org_units])
                if len(source_version_ids) != 1:
                    raise serializers.ValidationError("All orgunit should be in the same source version")
                source_version_id = list(source_version_ids)[0]
            if not scope.group:
                scope.group = Group.objects.create(name=name, source_version_id=source_version_id)
            else:
                scope.group.source_version_id = source_version_id
                scope.group.name = name
                scope.group.save()

            scope.group.org_units.set(org_units)

        for round_data in rounds:
            scopes = round_data.pop("scopes", [])
            round_serializer = RoundSerializer(data={**round_data, "campaign": campaign.id}, context=self.context)
            round_serializer.is_valid(raise_exception=True)
            round = round_serializer.save()

            for scope in scopes:
                vaccine = scope.get("vaccine")
                org_units = scope.get("group", {}).get("org_units")
                source_version_id = None
                if org_units:
                    source_version_ids = set([ou.version_id for ou in org_units])
                    if len(source_version_ids) != 1:
                        raise serializers.ValidationError("All orgunit should be in the same source version")
                    source_version_id = list(source_version_ids)[0]
                name = f"scope for round {round.number} campaign {campaign.obr_name} - {vaccine}"
                scope, created = round.scopes.get_or_create(vaccine=vaccine)
                if not scope.group:
                    scope.group = Group.objects.create(name=name)
                else:
                    scope.group.source_version_id = source_version_id
                    scope.group.name = name
                    scope.group.save()

                scope.group.org_units.set(org_units)

        campaign.update_geojson_field()
        campaign.save()
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
            source_version_id = None
            name = f"scope for campaign {instance.obr_name} - {vaccine}"
            if org_units:
                source_version_ids = set([ou.version_id for ou in org_units])
                if len(source_version_ids) != 1:
                    raise serializers.ValidationError("All orgunit should be in the same source version")
                source_version_id = list(source_version_ids)[0]
            if not scope.group:
                scope.group = Group.objects.create(name=name, source_version_id=source_version_id)
            else:
                scope.group.source_version_id = source_version_id
                scope.group.name = name
                scope.group.save()

            scope.group.org_units.set(org_units)

        round_instances = []
        # find existing round either by id or number
        # Fixme this is not a partial update because of the dfault
        for round_data in rounds:
            round = None
            if round_data.get("id"):
                round_id = round_data["id"]
                round = Round.objects.get(pk=round_id)
                if round.campaign != instance:
                    raise serializers.ValidationError({"rounds": "round is attached to a different campaign"})
            elif round_data.get("number", None) is not None:
                try:
                    round = instance.rounds.get(number=round_data.get("number"))
                except Round.DoesNotExist:
                    pass
            # we pop the campaign since we use the set afterward which will also remove the deleted one
            round_data.pop("campaign", None)
            scopes = round_data.pop("scopes", [])
            round_serializer = RoundSerializer(instance=round, data=round_data, context=self.context)
            round_serializer.is_valid(raise_exception=True)
            round_instance = round_serializer.save()
            round_instances.append(round_instance)
            for scope in scopes:
                vaccine = scope.get("vaccine")
                org_units = scope.get("group", {}).get("org_units")
                source_version_id = None
                if org_units:
                    source_version_ids = set([ou.version_id for ou in org_units])
                    if len(source_version_ids) != 1:
                        raise serializers.ValidationError("All orgunit should be in the same source version")
                    source_version_id = list(source_version_ids)[0]
                name = f"scope for round {round_instance.number} campaign {instance.obr_name} - {vaccine}"
                scope, created = round_instance.scopes.get_or_create(vaccine=vaccine)
                if not scope.group:
                    scope.group = Group.objects.create(name=name)
                else:
                    scope.group.source_version_id = source_version_id
                    scope.group.name = name
                    scope.group.save()

                scope.group.org_units.set(org_units)
        instance.rounds.set(round_instances)

        campaign = super().update(instance, validated_data)
        campaign.update_geojson_field()
        campaign.save()

        log_campaign_modification(campaign, old_campaign_dump, self.context["request"].user)
        return campaign

    # Vaccines with real scope
    vaccines = serializers.CharField(read_only=True)

    class Meta:
        model = Campaign
        # TODO in the future specify the fields that need to be returned so we can remove the deprecated fields
        # fields = "__all__"
        exclude = ["geojson"]

        read_only_fields = ["last_surge", "preperadness_sync_status", "creation_email_send_at", "group"]


class ListCampaignSerializer(CampaignSerializer):
    "This serializer contains juste enough data for the List view in the web ui"

    class NestedListRoundSerializer(RoundSerializer):
        class Meta:
            model = Round
            fields = [
                "id",
                "number",
                "started_at",
                "ended_at",
            ]

    rounds = NestedListRoundSerializer(many=True, required=False)

    class Meta:
        model = Campaign
        fields = [
            "id",
            "epid",
            "obr_name",
            "account",
            "cvdpv2_notified_at",
            "top_level_org_unit_name",
            "top_level_org_unit_id",
            "rounds",
            "general_status",
            "grouped_campaigns",
        ]
        read_only_fields = fields


class CalendarCampaignSerializer(CampaignSerializer):
    """This serializer contains juste enough data for the Calendar view in the web ui. Read only.
    Used by both anonymous and non-anonymous user"""

    class NestedListRoundSerializer(RoundSerializer):
        class NestedScopeSerializer(RoundScopeSerializer):
            class NestedGroupSerializer(GroupSerializer):
                class Meta:
                    model = Group
                    fields = ["id"]

            class Meta:
                model = RoundScope
                fields = ["group", "vaccine"]

            group = NestedGroupSerializer()

        class Meta:
            model = Round
            fields = [
                "id",
                "number",
                "started_at",
                "ended_at",
                "scopes",
            ]

    class NestedScopeSerializer(CampaignScopeSerializer):
        class NestedGroupSerializer(GroupSerializer):
            class Meta:
                model = Group
                fields = ["id"]

        class Meta:
            model = CampaignScope
            fields = ["group", "vaccine"]

        group = NestedGroupSerializer()

    rounds = NestedListRoundSerializer(many=True, required=False)
    scopes = NestedScopeSerializer(many=True, required=False)

    class Meta:
        model = Campaign
        fields = [
            "id",
            "epid",
            "obr_name",
            "account",
            "cvdpv2_notified_at",
            "top_level_org_unit_name",
            "top_level_org_unit_id",
            "rounds",
            "is_preventive",
            "general_status",
            "grouped_campaigns",
            "separate_scopes_per_round",
            "scopes",
            # displayed in RoundPopper
            "risk_assessment_status",
            "budget_status",
            "vaccines",
        ]
        read_only_fields = fields


class SmallCampaignSerializer(CampaignSerializer):
    class Meta:
        model = Campaign
        # TODO: refactor to avoid duplication with AnonymousCampaignSerializer?
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
            "account",
            "outbreak_declaration_date",
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
            "account",
            "outbreak_declaration_date",
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


class ExportCampaignSerializer(CampaignSerializer):
    class NestedRoundSerializer(RoundSerializer):
        class NestedRoundScopeSerializer(RoundScopeSerializer):
            class Meta:
                model = RoundScope
                fields = ["vaccine"]

        class NestedShipmentSerializer(ShipmentSerializer):
            class Meta:
                model = Shipment
                fields = [
                    "vaccine_name",
                    "po_numbers",
                    "vials_received",
                    "estimated_arrival_date",
                    "reception_pre_alert",
                    "date_reception",
                    "comment",
                ]

        class NestedDestructionSerializer(DestructionSerializer):
            class Meta:
                model = Destruction
                fields = [
                    "vials_destroyed",
                    "date_report_received",
                    "date_report",
                    "comment",
                ]

        class NestedRoundVaccineSerializer(RoundVaccineSerializer):
            class Meta:
                model = RoundVaccine
                fields = [
                    "name",
                    "doses_per_vial",
                    "wastage_ratio_forecast",
                ]

        class NestedRoundDateHistoryEntrySerializer(RoundVaccineSerializer):
            class Meta:
                model = RoundDateHistoryEntry
                fields = [
                    "previous_started_at",
                    "previous_ended_at",
                    "started_at",
                    "ended_at",
                    "reason",
                    "modified_by",
                    "created_at",
                ]

        class Meta:
            model = Round
            fields = [
                "scopes",
                "vaccines",
                "shipments",
                "destructions",
                "number",
                "started_at",
                "ended_at",
                "datelogs",
                "mop_up_started_at",
                "mop_up_ended_at",
                "im_started_at",
                "im_ended_at",
                "lqas_started_at",
                "lqas_ended_at",
                "target_population",
                "doses_requested",
                "cost",
                "im_percentage_children_missed_in_household",
                "im_percentage_children_missed_out_household",
                "im_percentage_children_missed_in_plus_out_household",
                "awareness_of_campaign_planning",
                "main_awareness_problem",
                "lqas_district_passing",
                "lqas_district_failing",
                "preparedness_spreadsheet_url",
                "preparedness_sync_status",
                "date_signed_vrf_received",
                "date_destruction",
                "vials_destroyed",
                "reporting_delays_hc_to_district",
                "reporting_delays_district_to_region",
                "reporting_delays_region_to_national",
                "forma_reception",
                "forma_missing_vials",
                "forma_usable_vials",
                "forma_unusable_vials",
                "forma_date",
                "forma_comment",
            ]

        scopes = NestedRoundScopeSerializer(many=True, required=False)
        vaccines = NestedRoundVaccineSerializer(many=True, required=False)
        shipments = NestedShipmentSerializer(many=True, required=False)
        destructions = NestedDestructionSerializer(many=True, required=False)
        datelogs = RoundDateHistoryEntrySerializer(many=True, required=False)

    class ExportCampaignScopeSerializer(CampaignScopeSerializer):
        class Meta:
            model = CampaignScope
            fields = ["vaccine"]

    rounds = NestedRoundSerializer(many=True, required=False)
    scopes = ExportCampaignScopeSerializer(many=True, required=False)

    class Meta:
        model = Campaign
        fields = [
            "obr_name",
            "rounds",
            "scopes",
            "gpei_coordinator",
            "gpei_email",
            "description",
            "initial_org_unit",
            "country",
            "creation_email_send_at",
            "onset_at",
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
            "surge_spreadsheet_url",
            "country_name_in_surge_spreadsheet",
            "budget_status",
            "is_test",
            "budget_current_state_key",
            "budget_current_state_label",
            "ra_completed_at_WFEDITABLE",
            "who_sent_budget_at_WFEDITABLE",
            "unicef_sent_budget_at_WFEDITABLE",
            "gpei_consolidated_budgets_at_WFEDITABLE",
            "submitted_to_rrt_at_WFEDITABLE",
            "feedback_sent_to_gpei_at_WFEDITABLE",
            "re_submitted_to_rrt_at_WFEDITABLE",
            "submitted_to_orpg_operations1_at_WFEDITABLE",
            "feedback_sent_to_rrt1_at_WFEDITABLE",
            "re_submitted_to_orpg_operations1_at_WFEDITABLE",
            "submitted_to_orpg_wider_at_WFEDITABLE",
            "submitted_to_orpg_operations2_at_WFEDITABLE",
            "feedback_sent_to_rrt2_at_WFEDITABLE",
            "re_submitted_to_orpg_operations2_at_WFEDITABLE",
            "submitted_for_approval_at_WFEDITABLE",
            "feedback_sent_to_orpg_operations_unicef_at_WFEDITABLE",
            "feedback_sent_to_orpg_operations_who_at_WFEDITABLE",
            "approved_by_who_at_WFEDITABLE",
            "approved_by_unicef_at_WFEDITABLE",
            "approved_at_WFEDITABLE",
            "approval_confirmed_at_WFEDITABLE",
            "who_disbursed_to_co_at",
            "who_disbursed_to_moh_at",
            "unicef_disbursed_to_co_at",
            "unicef_disbursed_to_moh_at",
            "eomg",
            "no_regret_fund_amount",
            "payment_mode",
            "created_at",
            "updated_at",
            "district_count",
            "is_preventive",
            "enable_send_weekly_email",
            "outbreak_declaration_date",
        ]
        read_only_fields = fields


class ConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = Config
        fields = ["created_at", "updated_at", "key", "data"]

    data = serializers.JSONField(source="content")  # type: ignore
    key = serializers.CharField(source="slug")
