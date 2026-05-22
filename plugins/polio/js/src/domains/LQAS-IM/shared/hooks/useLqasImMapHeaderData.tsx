import { useMemo } from 'react';
import { Campaign } from '../../../../constants/types';
import { computeScopeCounts, determineLqasImDates } from '../utils';

export const useLqasImMapHeaderData = ({
    campaign,
    campaigns,
    round,
    type,
    withScopeCount = false,
}) => {
    const campaignObject = useMemo(
        () =>
            campaigns.filter(
                (c: Record<string, unknown>) => c.obr_name === campaign,
            )[0] as Campaign,
        [campaign, campaigns],
    );

    const { start: startDate, end: endDate } = determineLqasImDates(
        campaignObject,
        round,
        type,
    );

    const scopeCount = computeScopeCounts(campaignObject, round);

    return useMemo(() => {
        if (withScopeCount) {
            return { startDate, endDate, scopeCount };
        }
        return { startDate, endDate };
    }, [endDate, scopeCount, startDate, withScopeCount]);
};
