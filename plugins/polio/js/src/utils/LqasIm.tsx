import React from 'react';
import {
    ConvertedLqasImData,
    LqasImCampaignData,
    LqasImData,
} from '../constants/types';
import { LqasImPopup } from '../components/LQAS-IM/LqasImPopUp';

const findRegion = (
    roundData: LqasImCampaignData,
    regions: Record<number, string>,
): string | null => {
    const districtId = roundData.district;
    if (districtId) return regions[districtId];
    return null;
};

const convertRoundDataToArray = (roundDataAsDict, regions) => {
    const roundData = Object.entries(roundDataAsDict);
    return roundData.map((entry: [string, LqasImCampaignData]) => {
        return {
            ...entry[1],
            name: entry[0],
            region: findRegion(entry[1], regions),
        };
    });
};

export const convertAPIData = (
    data: LqasImData,
    regions: Record<number, string> = {},
): Record<string, ConvertedLqasImData> => {
    if (!data) return {};
    const { stats } = data;
    const campaignKeys = Object.keys(stats);
    const result = {};
    campaignKeys.forEach(key => {
        if (stats[key]) {
            result[key] = {};
            result[key].round_1 = convertRoundDataToArray(
                stats[key].round_1,
                regions,
            );
            result[key].round_2 = convertRoundDataToArray(
                stats[key].round_2,
                regions,
            );
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
