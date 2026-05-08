from enum import Enum
from typing import Optional

from plugins.polio.models import Campaign
from plugins.polio.models.base import Round


class CampaignCategory(str, Enum):
    TEST_CAMPAIGN = "TEST_CAMPAIGN"
    CAMPAIGN_ON_HOLD = "CAMPAIGN_ON_HOLD"
    ALL_ROUNDS_ON_HOLD = "ALL_ROUNDS_ON_HOLD"
    ROUND_ON_HOLD = "ROUND_ON_HOLD"
    REGULAR = "REGULAR"


def compute_category_from_campaign(campaign: Optional[Campaign], round: Optional[Round]) -> str:
    if campaign is None:
        return CampaignCategory.REGULAR
    if campaign.is_test:
        return CampaignCategory.TEST_CAMPAIGN
    if campaign.on_hold:
        return CampaignCategory.CAMPAIGN_ON_HOLD
    if not campaign.rounds.exclude(on_hold=True).exists():
        return CampaignCategory.ALL_ROUNDS_ON_HOLD
    if round is not None and round.on_hold:
        return CampaignCategory.ROUND_ON_HOLD
    return CampaignCategory.REGULAR
