import { useMemo } from 'react';
import { LqasImData } from '../../../../constants/types';

export const makeDebugData = (
    data: LqasImData | undefined,
    campaign: string,
): Record<string, { hasScope: boolean; districtsNotFound: string[] }> => {
    if (!data?.stats || !campaign || !data.stats[campaign]) return {};
    return {
        [campaign]: {
            hasScope: data.stats[campaign].has_scope,
            districtsNotFound: data.stats[campaign].districts_not_found,
        },
    };
};

export const useDebugData = (
    data: LqasImData | undefined,
    campaign: string,
): Record<string, { hasScope: boolean; districtsNotFound: string[] }> => {
    return useMemo(() => makeDebugData(data, campaign), [data, campaign]);
};
