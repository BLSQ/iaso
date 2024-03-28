import { useMemo } from 'react';
import { CampaignFormValues } from '../../../constants/types';
import { useGetCampaignTypes } from './api/useGetCampaignTypes';

export const useIsPolioCampaignCheck = (): ((
    // eslint-disable-next-line no-unused-vars
    campaign?: CampaignFormValues,
) => boolean | undefined) => {
    const { data: campaignTypes } = useGetCampaignTypes();

    return useMemo(() => {
        return (campaign?: CampaignFormValues): boolean | undefined => {
            if (!campaign) {
                return undefined;
            }
            return (
                campaignTypes?.some(
                    type =>
                        type.value === 'polio' &&
                        campaign?.campaign_types?.includes(type.original?.id),
                ) ?? false
            );
        };
    }, [campaignTypes]);
};
