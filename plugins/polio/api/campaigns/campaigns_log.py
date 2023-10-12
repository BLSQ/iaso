from rest_framework import serializers

from hat.audit.models import CAMPAIGN_API, Modification
from iaso.models import Group
from plugins.polio.models import CampaignScope, Round, RoundScope
from plugins.polio.preparedness.spreadsheet_manager import Campaign


# the following serializer are used, so we can audit the modification on a campaign.
# The related Scope and Round can be modified in the same request but are modelised as separate ORM Object
# and DjangoSerializer don't serialize relation, DRF Serializer is used
class AuditGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
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

    scopes = AuditRoundScopeSerializer(many=True)


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
