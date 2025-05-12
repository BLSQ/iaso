import { IntlFormatMessage } from 'bluesquare-components';
import { isEqual } from 'lodash';
import MESSAGES from '../../../constants/messages';
import {
    BarChartData,
    ConvertedLqasImData,
    FormatForNFMArgs,
    LqasImCampaign,
    LqasImDistrictData,
} from '../../../constants/types';
import { OK_COLOR, WARNING_COLOR, FAIL_COLOR } from '../../../styles/constants';
import {
    LegendItem,
    findDataForShape,
    findScopeIds,
    makeLegendItem,
} from '../../../utils';
import { determineStatusForDistrict as lqasDistrictStatus } from '../LQAS/utils';
import { HASHED_BACKGROUND, IN_SCOPE } from '../shared/constants';
import {
    sortGraphKeys,
    convertStatToPercentNumber,
    accessDictRound,
    accessNfmStats,
    accessArrayRound,
} from '../shared/LqasIm';

import { LQASIMType } from '../shared/types/types';
import { IM_ERROR, IM_FAIL, IM_PASS, IM_WARNING, imNfmKeys } from './constants';

export const determineStatusForDistrict = district => {
    if (!district) return null;
    const ratio =
        (district.total_child_fmd / district.total_child_checked) * 100;
    if (ratio >= 95) return IM_PASS;
    if (ratio > 89 && ratio < 95) return IM_WARNING;
    return IM_FAIL;
};

export const getImStatsForRound = (
    imData: Record<string, ConvertedLqasImData>,
    campaign: string | undefined,
    round: number,
): ('1imOK' | '2imWarning' | '3imFail' | '4imError' | null)[][] => {
    if (!campaign || !imData[campaign]) return [[], [], []];
    const allStatuses = accessArrayRound(imData[campaign], round).map(
        district => {
            return determineStatusForDistrict(district);
        },
    );
    const passed = allStatuses.filter(status => status === IM_PASS);
    const disqualified = allStatuses.filter(status => status === IM_WARNING);
    const failed = allStatuses.filter(status => status === IM_FAIL);
    // Will be fixed when all statuses come from API
    // @ts-ignore
    const errored = allStatuses.filter(status => status === IM_ERROR);

    return [passed, failed, disqualified, errored];
};

export const makeImMapLegendItems =
    (formatMessage: IntlFormatMessage) =>
    (
        imData: Record<string, ConvertedLqasImData>,
        campaign: string | undefined,
        round: number,
    ): LegendItem[] => {
        const [passed, failed, disqualified, errored] = getImStatsForRound(
            imData,
            campaign,
            round,
        );
        const passedLegendItem = makeLegendItem({
            color: OK_COLOR,
            value: passed ? `${passed?.length}` : '',
            label: formatMessage(MESSAGES['1imOK']),
        });
        const disqualifiedLegendItem = makeLegendItem({
            color: WARNING_COLOR,
            value: disqualified ? `${disqualified?.length}` : '',
            label: formatMessage(MESSAGES['2imWarning']),
        });
        const failedLegendItem = makeLegendItem({
            color: FAIL_COLOR,
            value: failed ? `${failed?.length}` : '',
            label: formatMessage(MESSAGES['3imFail']),
        });
        const erroredLegendItem = makeLegendItem({
            background: HASHED_BACKGROUND,
            value: errored ? `${errored?.length}` : '',
            label: formatMessage(MESSAGES['4imError']),
        });

        return [
            passedLegendItem,
            disqualifiedLegendItem,
            failedLegendItem,
            erroredLegendItem,
        ];
    };

export const formatImDataForChart = ({ data, campaign, round, regions }) => {
    const dataForRound =
        campaign && data[campaign]
            ? accessArrayRound(data[campaign], round)
            : [];
    const regionsList: any[] = [];
    regions.forEach(region => {
        const regionData = dataForRound.filter(
            district => district.region_name === region.name,
        );
        if (regionData.length > 0) {
            const aggregatedData = regionData
                .map(district => ({
                    marked: district.total_child_fmd,
                    checked: district.total_child_checked,
                }))
                .reduce(
                    (total, current) => {
                        return {
                            marked: total.marked + current.marked,
                            checked: total.checked + current.checked,
                        };
                    },
                    { marked: 0, checked: 0 },
                );
            const { checked, marked } = aggregatedData;
            // forcing aggregatedData.checked to 1 to avoid dividing by 0
            const markedRatio = (marked / checked) * 100;
            regionsList.push({
                name: region.name,
                value: Number.isSafeInteger(markedRatio)
                    ? markedRatio
                    : Math.round(markedRatio),
                marked: aggregatedData.marked,
                checked: aggregatedData.checked,
            });
        }
    });
    return regionsList.sort(
        (a, b) => parseFloat(b.value) - parseFloat(a.value),
    );
};

export const imTooltipFormatter =
    formatMessage =>
    (
        _value: any,
        _name: any,
        props: { payload: { marked: number; checked: number } },
    ): [string, string] => {
        // eslint-disable-next-line react/prop-types
        const ratio = `${props.payload.marked}/${props.payload.checked}`;
        return [ratio, formatMessage(MESSAGES.vaccinated)];
    };

export const formatImDataForNFMChart = ({
    data,
    campaign,
    round,
    formatMessage,
}: FormatForNFMArgs<'lqas' | 'im'>): BarChartData[] => {
    if (!data || !campaign || !data[campaign]) return [] as BarChartData[];
    const campaignData: Record<string, number> = accessNfmStats(
        data[campaign],
        round,
    );

    const totalChildrenNotMarked = Object.values(campaignData).reduce(
        (total, current) => total + current,
        0,
    );
    const entries: [string, number][] = Object.entries(campaignData);
    const convertedEntries = entries.map(entry => {
        const [name, value] = entry;
        return {
            name: formatMessage(MESSAGES[name]),
            value: convertStatToPercentNumber(value, totalChildrenNotMarked),
            absValue: value,
            nfmKey: name,
        };
    });
    if (convertedEntries.length === imNfmKeys.length)
        return convertedEntries.sort(sortGraphKeys);

    const dataKeys = Object.keys(campaignData);
    const missingEntries = imNfmKeys
        .filter(nfmKey => !dataKeys.includes(nfmKey))
        .map(nfmKey => ({
            name: formatMessage(MESSAGES[nfmKey]),
            value: convertStatToPercentNumber(0, totalChildrenNotMarked),
            absValue: 0,
            nfmKey,
        }));
    return [...convertedEntries, ...missingEntries].sort(sortGraphKeys);
};

export const sumChildrenCheckedIm = (
    round: number,
    data?: Record<string, LqasImCampaign>,
    campaign?: string,
): number => {
    if (!data || !campaign || !data[campaign]) return 0;
    const roundData: LqasImDistrictData[] = Object.values(
        accessDictRound(data[campaign], round),
    );
    return roundData.reduce(
        (total, current) => total + current.total_child_checked,
        0,
    );
};
type GetMapLayerArgs = {
    selectedCampaign?: string;
    data: Record<string, ConvertedLqasImData>;
    type: LQASIMType;
    campaigns: any[];
    round: number;
    shapes: any[];
};

export const getLqasImMapLayer = ({
    data,
    selectedCampaign,
    type,
    campaigns,
    round,
    shapes,
}: GetMapLayerArgs): any[] => {
    if (isEqual(data, {})) return [];
    if (!selectedCampaign) return [];
    const determineStatus =
        type === 'lqas' ? lqasDistrictStatus : determineStatusForDistrict;
    const scopeIds = findScopeIds(selectedCampaign, campaigns, round);
    const hasScope = scopeIds.length > 0;
    const shapesInScope = hasScope
        ? shapes.filter(shape => scopeIds.includes(shape.id))
        : shapes;
    const shapesWithData = shapesInScope.map(shape => ({
        ...shape,
        data: findDataForShape({
            shape,
            data,
            round,
            campaign: selectedCampaign,
        }),
    }));
    if (hasScope) {
        return shapesWithData.map(shape => ({
            ...shape,
            status: shape.data ? determineStatus(shape.data) : IN_SCOPE,
        }));
    }
    return [];
};
