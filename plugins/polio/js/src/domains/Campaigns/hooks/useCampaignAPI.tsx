import { useMemo } from 'react';
import { useGetCampaignLogs } from '../campaignHistory/hooks/useGetCampaignHistory';
import { useGetCampaign } from './api/useGetCampaign';
import { useSaveCampaign } from './api/useSaveCampaign';

type Args = {
    campaignId?: boolean;
    enableGetLogs?: boolean;
};

export const useCampaignAPI = ({ campaignId, enableGetLogs = false }) => {
    const { mutate: saveCampaign, isLoading: isSaving } = useSaveCampaign();

    const { data: selectedCampaign, isFetching } = useGetCampaign(campaignId);

    const { data: campaignLogs } = useGetCampaignLogs(
        selectedCampaign?.id,
        enableGetLogs,
    );

    return useMemo(() => {
        return {
            saveCampaign,
            isSaving,
            selectedCampaign,
            isFetching,
            campaignLogs,
        };
    }, [saveCampaign, isSaving, selectedCampaign, isFetching, campaignLogs]);
};
