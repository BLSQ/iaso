import {
    LQAS_STRICT_PASS,
    LQAS_STRICT_FAIL,
    LQAS_LAX_PASS,
    LQAS_LAX_FAIL,
} from './constants';

export const findLQASDataForShape = (shapeName, LQASData, round) => {
    if (!LQASData) return null;
    const { stats } = LQASData;
    const campaignKeys = Object.keys(stats);
    let filtered = {};
    // This will overwrite data if an org unit is part of 2 campaigns
    campaignKeys.forEach(key => {
        filtered = { ...filtered, ...stats[key][round] };
    });
    return filtered[shapeName];
};

const laxLQASPass = (checked, marked) => {
    return Math.floor(60 * (marked / checked)) >= 57;
};

export const determineStatusForDistrict = district => {
    if (!district) return null;
    const { total_child_fmd: marked, total_child_checked: checked } = district;
    if (checked === 60) {
        if (marked === 60) return LQAS_STRICT_PASS;
        return LQAS_STRICT_FAIL;
    }
    if (laxLQASPass(checked, marked)) {
        return LQAS_LAX_PASS;
    }
    return LQAS_LAX_FAIL;
};

export const makeCampaignsDropDown = campaigns =>
    campaigns.map(campaign => {
        return {
            label: campaign.obr_name,
            value: campaign.obr_name,
        };
    });
