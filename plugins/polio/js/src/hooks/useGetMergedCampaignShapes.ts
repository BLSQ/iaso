import { UseQueryResult } from 'react-query';
import { useGetCampaigns } from './useGetCampaigns';

const URL = '/api/polio/campaigns/v3/merged_shapes.geojson/';

export const useGetMergedCampaignShapes = (options = {}): UseQueryResult =>
    useGetCampaigns(options, URL, 'mergedCampaigns');
