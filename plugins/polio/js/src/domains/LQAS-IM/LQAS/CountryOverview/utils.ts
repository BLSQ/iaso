import {
    BarChartData,
    ConvertedLqasImData,
    FormatForNFMArgs,
    LqasImCampaign,
} from '../../types';
import { determineStatusForDistrict, sumChildrenCheckedLqas } from '../utils';
import { childrenNotMarked, convertStatToPercent } from '../../shared/LqasIm';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';
import { useMemo } from 'react';
import { calculateChildrenAbsent } from '../../shared/hooks/useRfaTitle';
import { Campaign } from '../../../..//constants/types';
import { isEqual } from 'lodash';
import { OrgUnit } from 'Iaso/domains/orgUnits/types/orgUnit';
import { findDataForShape } from '../../../..//utils';
import { IN_SCOPE } from '../../shared/constants';
import { computeScopeCounts, determineLqasImDates } from '../../shared/utils';

export const makeLqasRatioUnmarked = ({
    data,
    campaignObrName,
    roundNumber,
}: {
    data?: Record<string, LqasImCampaign>;
    campaignObrName?: string;
    roundNumber?: number;
}): string => {
    const checked = sumChildrenCheckedLqas(roundNumber, data, campaignObrName);
    const notMarked = childrenNotMarked({
        data,
        campaign: campaignObrName,
        round: roundNumber,
    });
    return convertStatToPercent(notMarked, checked);
};

/**
 * Nfm stands for "No finger mark"
 * This hook returns the title to be used in a chart
 * showing data about children that were not vaccinated, i.e had no mark on their finger
 */
export const useLqasNfmTitle = ({
    data,
    campaignObrName,
    roundNumber,
}: {
    data?: Record<string, LqasImCampaign>;
    campaignObrName?: string;
    roundNumber?: number;
}): string => {
    const { formatMessage } = useSafeIntl();
    const ratioUnmarked = makeLqasRatioUnmarked({
        data,
        campaignObrName,
        roundNumber,
    });
    return `${formatMessage(MESSAGES.childrenNoMark)}: ${ratioUnmarked}`;
};

type UseVerticalChartDataArgs = {
    data?: Record<string, LqasImCampaign>;
    campaignObrName?: string;
    roundNumber?: number;
    formatter: (args: FormatForNFMArgs<string>) => BarChartData[];
    type: string;
};

export const useLqasVerticalChartData = ({
    data,
    campaignObrName,
    formatter,
    type,
    roundNumber,
}: UseVerticalChartDataArgs): BarChartData[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return formatter({
            data,
            campaign: campaignObrName,
            round: roundNumber,
            formatMessage,
            type,
        });
    }, [formatter, data, campaignObrName, roundNumber, formatMessage, type]);
};

export const useLqasRfaTitle = ({
    data,
    campaignObrName,
    roundNumber,
}: {
    data?: Record<string, LqasImCampaign>;
    campaignObrName?: string;
    roundNumber?: number;
}): string => {
    const { formatMessage } = useSafeIntl();
    const accessor = 'childabsent';
    const childrenAbsent = calculateChildrenAbsent({
        data,
        campaign: campaignObrName,
        round: roundNumber,
        accessor,
    });
    return `${formatMessage(MESSAGES.childrenNfmAbsent)}: ${childrenAbsent}`;
};

export const findScopeIdsForRound = ({
    campaign,
    roundNumber,
}: {
    campaign: Campaign;
    roundNumber?: number;
}) => {
    if (!campaign.separate_scopes_per_round) {
        return campaign.scopes
            ?.filter(scope => scope.group)
            .map(scope => scope.group!.org_units)
            .flat();
    }
    const fullRound = campaign.rounds?.find(
        round => round.number === roundNumber,
    );
    if (fullRound) {
        return fullRound.scopes
            ?.filter(scope => scope.group)
            .map(scope => scope.group!.org_units)
            .flat();
    }
    return [];
};

type GetLqasMapLayerArgs = {
    campaign?: Campaign;
    data: Record<string, ConvertedLqasImData>;
    roundNumber?: number;
    shapes: OrgUnit[];
};
export const getLqasMapLayer = ({
    data,
    campaign,
    roundNumber,
    shapes,
}: GetLqasMapLayerArgs) => {
    if (isEqual(data, {})) return [];
    if (!campaign) return [];
    const scopeIds = findScopeIdsForRound({
        campaign,
        roundNumber,
    });
    if (roundNumber === 1) {
        console.log('SCOPE IDS', scopeIds);
    }
    if (scopeIds.length === 0) {
        console.log('CAMPAIGN', campaign, typeof roundNumber, roundNumber);
    }
    const hasScope = scopeIds.length > 0;
    const shapesInScope = hasScope
        ? shapes.filter(shape => scopeIds.includes(shape.id))
        : shapes;
    const shapesWithData = shapesInScope.map(shape => ({
        ...shape,
        data: findDataForShape({
            shape,
            data,
            round: roundNumber,
            campaign: campaign?.obr_name,
        }),
    }));
    if (hasScope) {
        return shapesWithData.map(shape => ({
            ...shape,
            status: shape.data
                ? determineStatusForDistrict(shape.data)
                : IN_SCOPE,
        }));
    }
    return [];
};

export const useLqasMapHeaderData = ({
    campaign,
    roundNumber,
    withScopeCount = false,
}) => {
    const { start: startDate, end: endDate } = determineLqasImDates(
        campaign,
        roundNumber,
        'lqas',
    );
    const scopeCount = computeScopeCounts(campaign, roundNumber);
    return useMemo(() => {
        if (withScopeCount) {
            return { startDate, endDate, scopeCount };
        }
        return { startDate, endDate };
    }, [endDate, scopeCount, startDate, withScopeCount]);
};
