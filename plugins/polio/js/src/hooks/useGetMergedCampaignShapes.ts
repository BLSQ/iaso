import { UseQueryResult } from 'react-query';
import { MergedShapes } from '../constants/types';
import { useGetCampaigns } from './useGetCampaigns';

const URL = '/api/polio/campaigns/v3/merged_shapes.geojson/';

type Result = {
    exportToCSV: CallableFunction;
    query: UseQueryResult<MergedShapes>;
};

export const useGetMergedCampaignShapes = (options = {}): Result =>
    useGetCampaigns(options, URL, 'mergedCampaigns');
