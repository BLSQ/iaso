import React from 'react';
import {
    ConvertedLqasImData,
    LqasImCampaignData,
    LqasImData,
} from '../constants/types';
import { LqasImPopup } from '../components/LQAS-IM/LqasImPopUp';

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
