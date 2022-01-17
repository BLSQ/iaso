/* eslint-disable camelcase */
import React from 'react';
import {
    ConvertedLqasImData,
    LqasImCampaignData,
    LqasImData,
    LqasImMapLegendData,
    LqasImParams,
} from '../constants/types';
import { LqasImPopup } from '../components/LQAS-IM/LqasImPopUp';
import { convertStatToPercent } from '../pages/LQAS/utils';

const convertRoundDataToArray = roundDataAsDict => {
    const roundData = Object.entries(roundDataAsDict);
    return roundData.map((entry: [string, LqasImCampaignData]) => {
        return {
            ...entry[1],
            name: entry[0],
        };
    });
};

export const convertAPIData = (
    data: LqasImData,
): Record<string, ConvertedLqasImData> => {
    if (!data) return {};
    const { stats } = data;
    const campaignKeys = Object.keys(stats);
    const result = {};
    campaignKeys.forEach(key => {
        if (stats[key]) {
            result[key] = {};
            result[key].round_1 = convertRoundDataToArray(stats[key].round_1);
            result[key].round_2 = convertRoundDataToArray(stats[key].round_2);
        }
    });
    return result;
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

export const findCountryIds = LqasIm => {
    const { stats } = LqasIm;
    const campaignKeys = Object.keys(stats);
    return campaignKeys.map(campaignKey => stats[campaignKey].country_id);
};

export const totalCaregiversInformed = (roundData: any[] = []) => {
    return roundData
        .map(data => data.care_giver_stats.caregivers_informed)
        .reduce((total, current) => total + current, 0);
};

export const totalCaregivers = (roundData: any[] = []) => {
    return roundData
        .map(data => data.total_child_checked)
        .reduce((total, current) => total + current, 0);
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
        if (type === 'imGlobal')
            return {
                total_child_checked,
                total_sites_visited,
                reportingDistricts,
            };
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
