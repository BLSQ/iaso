import { useGetCampaigns } from './useGetCampaigns';

const URL = '/api/polio/campaigns/merged_shapes.geojson/';

export const useGetMergedCampaignShapes = (options = {}) =>
    useGetCampaigns(options, URL, 'mergedCampaigns');
