from plugins.polio.api.campaigns.serializers.campaigns import CampaignSerializer
from plugins.polio.api.campaigns.serializers.shared import CampaignTypeSerializer
from plugins.polio.api.rounds.serializers import RoundAnonymousSerializer
from plugins.polio.models import (
    Campaign,
)
from plugins.polio.preparedness.spreadsheet_manager import (
    Campaign,
)


class AnonymousCampaignSerializer(CampaignSerializer):
    rounds = RoundAnonymousSerializer(many=True)
    campaign_types = CampaignTypeSerializer(many=True, required=False)

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
            "onset_at",
            "cvdpv2_notified_at",
            "pv_notified_at",
            "pv2_notified_at",
            "virus",
            "scopes",
            "vaccines",
            "detection_status",
            "detection_responsible",
            "detection_first_draft_submitted_at",
            "risk_assessment_status",
            "risk_assessment_responsible",
            "investigation_at",
            "risk_assessment_first_draft_submitted_at",
            "risk_assessment_rrt_oprtt_approval_at",
            "ag_nopv_group_met_at",
            "dg_authorized_at",
            "verification_score",
            "budget_status",
            "who_disbursed_to_co_at",
            "who_disbursed_to_moh_at",
            "unicef_disbursed_to_co_at",
            "unicef_disbursed_to_moh_at",
            "no_regret_fund_amount",
            "payment_mode",
            "rounds",
            "created_at",
            "updated_at",
            "district_count",
            "top_level_org_unit_name",
            "top_level_org_unit_id",
            "is_preventive",
            "account",
            "outbreak_declaration_date",
            "campaign_types",
            "separate_scopes_per_round",
        ]
        read_only_fields = fields
