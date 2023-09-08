from django.db import transaction
from django.db.transaction import atomic
from django.utils import timezone
from django.utils.translation import gettext as _
from gspread.exceptions import APIError  # type: ignore
from iaso.utils import geojson_queryset
from rest_framework import serializers
from rest_framework.fields import Field
from rest_framework.validators import UniqueValidator
from functools import reduce

from hat.audit.models import Modification, CAMPAIGN_API
from iaso.api.common import UserSerializer
from iaso.models import Group
from ..models import (
    Round,
    RoundVaccine,
    Shipment,
    Destruction,
    SpreadSheetImport,
    CampaignGroup,
    RoundScope,
    CampaignScope,
)
from ..preparedness.calculator import get_preparedness_score
from ..preparedness.parser import (
    InvalidFormatError,
    get_preparedness,
)
from ..preparedness.spreadsheet_manager import *
from ..preparedness.spreadsheet_manager import generate_spreadsheet_for_campaign
from ..preparedness.summary import preparedness_summary, set_preparedness_cache_for_round
from iaso.api.serializers import OrgUnitSerializer as OUSerializer

logger = getLogger(__name__)


class UserSerializerForPolio(UserSerializer):
    class Meta(UserSerializer.Meta):
        fields = ["id", "username", "first_name", "last_name", "email"]
        ref_name = "polio_user_serializer"


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


class GroupSerializer(serializers.ModelSerializer):
    org_units = serializers.PrimaryKeyRelatedField(
        many=True, allow_empty=True, queryset=OrgUnit.objects.all(), style={"base_template": "input.html"}
    )
    name = serializers.CharField(default="hidden")

    class Meta:
        model = Group
        fields = ["name", "org_units", "id"]
        ref_name = "polio_group_serializer"


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
