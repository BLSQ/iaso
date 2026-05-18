import { UseQueryResult } from 'react-query';
import { useGetCampaigns } from '../../Campaigns/hooks/api/useGetCampaigns';

const URL = '/api/polio/campaigns/v3/merged_shapes.geojson/';

// TODO pass filter params correctly
export const useGetMergedCampaignShapes = (options = {}): UseQueryResult =>
    useGetCampaigns(options, URL, 'mergedCampaigns');
