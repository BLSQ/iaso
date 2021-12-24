import {
    ConvertedLqasImData,
    LqasImCampaignData,
    LqasData,
} from '../pages/LQAS/types';

const findRegion = (
    roundData: LqasImCampaignData,
    regions: Record<number, string>,
): string | null => {
    const districtId = roundData.district;
    if (districtId) return regions[districtId];
    return null;
};

const convertRoundDataToArray = (roundDataAsDict, regions) => {
    const districtNames = Object.keys(roundDataAsDict);
    const roundData = Object.values(roundDataAsDict);
    return roundData.map((value: LqasImCampaignData, index: number) => {
        return {
            ...value,
            name: districtNames[index],
            region: findRegion(value, regions),
        };
    });
};

export const convertAPIData = (
    data: LqasData,
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
