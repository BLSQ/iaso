import { useMemo } from 'react';
import { useGetCampaign } from './api/useGetCampaign';
import { useSaveCampaign } from './api/useSaveCampaign';

type Args = {
    campaignId?: string;
};

export const useCampaignAPI = ({ campaignId }: Args) => {
    const { mutate: saveCampaign, isLoading: isSaving } = useSaveCampaign();

    const { data: selectedCampaign, isFetching } = useGetCampaign(campaignId);

    return useMemo(() => {
        return {
            saveCampaign,
            isSaving,
            selectedCampaign,
            isFetching,
        };
    }, [saveCampaign, isSaving, selectedCampaign, isFetching]);
};
