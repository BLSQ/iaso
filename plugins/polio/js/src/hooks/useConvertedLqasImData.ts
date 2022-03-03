import { useMemo } from 'react';
import {
    ConvertedLqasImData,
    LqasImCampaignData,
    LqasImData,
} from '../constants/types';

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

export const useConvertedLqasImData = (
    data: LqasImData,
): Record<string, ConvertedLqasImData> => {
    return useMemo(() => convertAPIData(data), [data]);
};
