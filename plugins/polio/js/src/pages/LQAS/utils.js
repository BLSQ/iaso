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
export const totalDistrictsEvaluatedPerRound = LQASData => {
    if (!LQASData) return { evaluatedRound1: [], evaluatedRound2: [] };
    let totalEvaluatedRound1 = [];
    let totalEvaluatedRound2 = [];
    Object.keys(LQASData.stats).forEach(campaignKey => {
        const districtsRound1 = Object.keys(
            LQASData.stats[campaignKey].round_1,
        );
        const districtsRound2 = Object.keys(
            LQASData.stats[campaignKey].round_2,
        );
        totalEvaluatedRound1 = [...totalEvaluatedRound1, ...districtsRound1];
        totalEvaluatedRound2 = [...totalEvaluatedRound2, ...districtsRound2];
    });

    const evaluatedRound1 = new Set(totalEvaluatedRound1);
    const evaluatedRound2 = new Set(totalEvaluatedRound2);
    return { evaluatedRound1, evaluatedRound2 };
};
