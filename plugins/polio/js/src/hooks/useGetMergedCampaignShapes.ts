import { useGetCampaigns } from './useGetCampaigns';

const URL = '/api/polio/campaigns/v2/merged_shapes.geojson/';

export const useGetMergedCampaignShapes = (options = {}) =>
    useGetCampaigns(options, URL, 'mergedCampaigns');
