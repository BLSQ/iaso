import { Campaign } from '../../../constants/types';
import { findCampaignRound } from '../../../utils';
import { LqasImRefDate } from './LqasImMapHeader';
import { LQASIMType } from './types/types';

export const determineLqasImDates = (
    campaign: Campaign,
    round: number,
    type: LQASIMType,
):
    | { start: LqasImRefDate; end: LqasImRefDate }
    | Record<string, LqasImRefDate> => {
    if (!campaign) return {};
    const roundData = findCampaignRound(campaign, round);
    if (!roundData) {
        console.warn(
            `No data found for round ${round} in campaign ${campaign.obr_name}`,
        );
        return {};
    }
    const lqasImStart =
        type === 'lqas' ? roundData.lqas_started_at : roundData.im_started_at;
    const lqasImEnd =
        type === 'lqas' ? roundData.lqas_ended_at : roundData.im_ended_at;
    const roundStart = roundData.started_at;
    const roundEnd = roundData.ended_at;
    const startDate = lqasImStart ?? roundStart;
    const endDate = lqasImEnd ?? roundEnd;
    // TODO handle endDate is before startDate
    return {
        start: {
            date: startDate,
            isDefault: !lqasImStart,
        },
        end: {
            date: endDate,
            isDefault: !lqasImEnd,
        },
    };
};

export const aggregateScopes = scopes => {
    return scopes.map(scope => scope.group.org_units).flat();
};

export const computeScopeCounts = (
    campaign?: Campaign,
    roundNumber?: number,
): number => {
    if (!campaign) return 0;
    if (campaign.separate_scopes_per_round) {
        const round = campaign.rounds.find(r => r.number === roundNumber);
        const scope = round ? aggregateScopes(round.scopes) : [];
        return scope.length;
    }
    return aggregateScopes(campaign?.scopes ?? []).length;
};
