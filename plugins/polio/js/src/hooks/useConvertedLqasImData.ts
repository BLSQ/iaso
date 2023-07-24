import { useMemo } from 'react';
import {
    ConvertedLqasImData,
    LqasImDistrictData,
    LqasImData,
} from '../constants/types';

const convertRoundDataToArray = roundDataAsDict => {
    const roundData = Object.entries(roundDataAsDict);
    const result = roundData.map((entry: [string, LqasImDistrictData]) => {
        return {
            ...entry[1],
            name: entry[0],
        };
    });
    return result;
};

export const convertAPIData = (
    data?: LqasImData,
): Record<string, ConvertedLqasImData> => {
    if (!data) return {};
    const { stats } = data;
    const campaignKeys = Object.keys(stats);
    const result = {};
    campaignKeys.forEach(key => {
        if (stats[key]) {
            result[key] = {};
            result[key].rounds = stats[key].rounds.map(round => ({
                ...round,
                data: convertRoundDataToArray(round.data),
            }));
        }
    });
    return result;
};

export const useConvertedLqasImData = (
    data?: LqasImData,
): Record<string, ConvertedLqasImData> => {
    return useMemo(() => convertAPIData(data), [data]);
};
