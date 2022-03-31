/* eslint-disable camelcase */
import React from 'react';
import {
    BarChartData,
    FormatForNFMArgs,
    IntlFormatMessage,
    LqasImCampaign,
    LqasImMapLegendData,
    LqasImParams,
    NfmRoundString,
    RfaRoundString,
    RoundString,
} from '../constants/types';
import { LqasImPopup } from '../components/LQAS-IM/LqasImPopUp';
import { sumChildrenCheckedLqas } from '../pages/LQAS/utils';
import MESSAGES from '../constants/messages';
import {
    imNfmKeys,
    lqasNfmKeys,
    lqasRfaKeys,
    imRfaKeys,
} from '../pages/IM/constants';
import { sumChildrenCheckedIm } from '../pages/IM/utils';

export const convertStatToPercent = (data = 0, total = 1): string => {
    if (data > total)
        throw new Error(
            `data can't be greater than total. data: ${data}, total: ${total}`,
        );
    // using safeTotal, because 0 can still be passed as arg and override default value
    const safeTotal = total || 1;
    const ratio = (100 * data) / safeTotal;
    if (Number.isSafeInteger(ratio)) return `${ratio}%`;
    return `${Math.round(ratio)}%`;
};
export const convertStatToPercentNumber = (data = 0, total = 1): number => {
    if (data > total) throw new Error("data can't be greater than total");
    // using safeTotal, because 0 can still be passed as arg and override default value
    const safeTotal = total || 1;
    const ratio = (100 * data) / safeTotal;
    return ratio;
};

export const makePopup =
    (LQASData, round, campaign = '') =>
    shape => {
        return (
            <LqasImPopup
                shape={shape}
                data={LQASData}
                round={round}
                campaign={campaign}
            />
        );
    };

export const totalCaregiversInformed = (roundData: any[] = []) => {
    return roundData
        .map(data => data.care_giver_stats.caregivers_informed)
        .reduce((total, current = 0) => total + current, 0);
};

export const totalCaregivers = (roundData: any[] = []) => {
    return roundData
        .map(data => data.total_child_checked)
        .reduce((total, current = 0) => total + current, 0);
};

const makeCollectionStats = ({
    type,
    data,
    campaign,
    round,
}: LqasImParams): LqasImMapLegendData | Record<string, never> => {
    if (!data || !campaign || !data[campaign]) return {};
    if (type !== 'lqas') {
        const aggregatedData = data[campaign][round].reduce(
            (total, current) => {
                return {
                    reportingDistricts: total.reportingDistricts + 1,
                    total_child_checked:
                        total.total_child_checked + current.total_child_checked,
                    total_child_fmd:
                        total.total_child_fmd + current.total_child_fmd,
                    total_sites_visited:
                        total.total_sites_visited + current.total_sites_visited,
                };
            },
            {
                reportingDistricts: 0,
                total_child_checked: 0,
                total_child_fmd: 0,
                total_sites_visited: 0,
            },
        );
        const { total_child_checked, total_sites_visited, reportingDistricts } =
            aggregatedData;
        const { total_child_checked: checked, total_child_fmd: marked } =
            aggregatedData;
        const ratioUnvaccinated = convertStatToPercent(
            checked - marked,
            checked,
        );
        return {
            total_child_checked,
            total_sites_visited,
            reportingDistricts,
            ratioUnvaccinated,
        };
    }
    return {};
};

const convertLegendDataToArray = (
    data: LqasImMapLegendData | Record<string, never>,
) => {
    return Object.entries(data).map(([key, value]: [string, string]) => ({
        id: key,
        value,
    }));
};

export const makeAccordionData = ({
    type,
    data,
    campaign,
    round,
}: LqasImParams): { id: string; value: string }[] => {
    return convertLegendDataToArray(
        makeCollectionStats({
            type,
            data,
            campaign,
            round,
        }),
    );
};

export const sortGraphKeys = (a, b) => b.absValue - a.absValue;

const childrenNotMarked = ({
    data,
    campaign,
    round,
}: {
    data?: Record<string, LqasImCampaign>;
    campaign?: string;
    round: RoundString;
}): number => {
    if (!data || !campaign || !data[campaign]) return 0;
    const roundString: string = NfmRoundString[round];
    const campaignData: Record<string, number> = data[campaign][roundString];
    return Object.values(campaignData).reduce(
        (total, current) => total + current,
        0,
    );
};

export const makeRatioUnmarked = ({
    data,
    campaign,
    type,
}: {
    data?: Record<string, LqasImCampaign>;
    campaign?: string;
    type: 'lqas' | 'im';
}): string[] => {
    const childrenCheckedRound1 =
        type === 'lqas'
            ? sumChildrenCheckedLqas('round_1', data, campaign)
            : sumChildrenCheckedIm('round_1', data, campaign);
    const childrenCheckedRound2 =
        type === 'lqas'
            ? sumChildrenCheckedLqas('round_2', data, campaign)
            : sumChildrenCheckedIm('round_2', data, campaign);
    const childrenNotMarkedRound1 = childrenNotMarked({
        data,
        campaign,
        round: 'round_1',
    });
    const childrenNotMarkedRound2 = childrenNotMarked({
        data,
        campaign,
        round: 'round_2',
    });

    return [
        convertStatToPercent(childrenNotMarkedRound1, childrenCheckedRound1),
        convertStatToPercent(childrenNotMarkedRound2, childrenCheckedRound2),
    ];
};

const convertEntries = (
    entries: [string, number][],
    referenceValue: number,
    formatMessage: IntlFormatMessage,
) => {
    return entries.map(entry => {
        const [name, value] = entry;
        return {
            name: MESSAGES[name] ? formatMessage(MESSAGES[name]) : name,
            value: convertStatToPercentNumber(value, referenceValue),
            absValue: value,
            originalKey: name,
        };
    });
};

const makeMissingEntries = (
    dataKeys: string[],
    referenceValue: number,
    referenceKeys: string[],
    formatMessage: IntlFormatMessage,
) => {
    return (
        referenceKeys
            // Not showing 'unknown' if it wasn't in the form
            .filter(
                refKey => !dataKeys.includes(refKey) && refKey !== 'unknown',
            )
            .map(refKey => ({
                name: formatMessage(MESSAGES[refKey]),
                value: convertStatToPercentNumber(0, referenceValue),
                absValue: 0,
                originalKey: refKey,
            }))
    );
};

export const formatForNfmChart = ({
    data,
    campaign,
    round,
    formatMessage,
    type,
}: FormatForNFMArgs<'lqas' | 'im'>): BarChartData[] => {
    if (!data || !campaign || !data[campaign]) return [] as BarChartData[];
    const roundString: string = NfmRoundString[round];
    const campaignData: Record<string, number> = data[campaign][roundString];
    const totalChildrenNotMarked = Object.values(campaignData).reduce(
        (total, current) => total + current,
        0,
    );
    if (!totalChildrenNotMarked) return [] as BarChartData[];

    const convertedEntries = convertEntries(
        Object.entries(campaignData),
        totalChildrenNotMarked,
        formatMessage,
    );
    const referenceKeys = type === 'lqas' ? lqasNfmKeys : imNfmKeys;
    // check that the form includes all known keys
    if (
        referenceKeys.every(referenceKey =>
            Object.keys(campaignData).includes(referenceKey),
        )
    )
        return convertedEntries.sort(sortGraphKeys);
    // Adding missing know keys to the graph
    const missingEntries = makeMissingEntries(
        Object.keys(campaignData),
        totalChildrenNotMarked,
        referenceKeys,
        formatMessage,
    );
    return [...convertedEntries, ...missingEntries].sort(sortGraphKeys);
};

export const formatForRfaChart = ({
    data,
    campaign,
    round,
    formatMessage,
    type,
}: FormatForNFMArgs<'lqas' | 'im'>): BarChartData[] => {
    if (!data || !campaign || !data[campaign]) return [] as BarChartData[];
    const nfmRoundString = NfmRoundString[round];
    const totalChildrenAbsent =
        type === 'lqas'
            ? data[campaign][nfmRoundString].childabsent
            : data[campaign][nfmRoundString].Tot_child_Absent_HH;

    if (!totalChildrenAbsent) return [] as BarChartData[];

    // TODO this can be abstracted further
    const roundString: string = RfaRoundString[round];
    const campaignData: Record<string, number> = data[campaign][roundString];
    const convertedEntries = convertEntries(
        Object.entries(campaignData),
        totalChildrenAbsent,
        formatMessage,
    );

    const referenceKeys = type === 'lqas' ? lqasRfaKeys : imRfaKeys;
    // check that the form includes all known keys
    if (
        referenceKeys.every(referenceKey =>
            Object.keys(campaignData).includes(referenceKey),
        )
    )
        return convertedEntries.sort(sortGraphKeys);
    // Adding missing know keys to the graph
    const missingEntries = makeMissingEntries(
        Object.keys(campaignData),
        totalChildrenAbsent,
        referenceKeys,
        formatMessage,
    );

    return [...convertedEntries, ...missingEntries].sort(sortGraphKeys);
};
export const verticalChartTooltipFormatter = (
    value: number,
    _name: string,
    props: { payload: { originalKey: string } },
): [string, string] => {
    // eslint-disable-next-line react/prop-types
    return [`${Math.round(value)}%`, props.payload.originalKey];
};
