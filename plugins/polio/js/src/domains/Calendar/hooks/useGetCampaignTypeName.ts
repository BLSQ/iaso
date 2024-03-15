import { useGetCampaignTypes } from '../../Campaigns/hooks/api/useGetCampaignTypes';

// eslint-disable-next-line no-unused-vars
export const useGetCampaignTypeName = (): ((campaignId: number) => string) => {
    const { data: types } = useGetCampaignTypes();
    return campaignId =>
        (types || []).find(type => type.value === campaignId)?.original?.name ||
        '';
};
