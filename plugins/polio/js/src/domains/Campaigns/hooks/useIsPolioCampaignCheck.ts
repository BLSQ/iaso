import { useMemo } from 'react';
import {
    CampaignFormValues,
    CampaignTypesDropdown,
} from '../../../constants/types';
import { useGetCampaignTypes } from './api/useGetCampaignTypes';

const isPolioCampaign = (
    campaign: CampaignFormValues | undefined,
    campaignTypes?: CampaignTypesDropdown[],
): boolean => {
    if (!campaign) {
        return false;
    }
    return (
        campaignTypes?.some(
            type =>
                type.value === 'polio' &&
                campaign.campaign_types?.includes(type.original?.id),
        ) ?? false
    );
};

export const useIsPolioCampaign = (
    campaign?: CampaignFormValues,
): boolean | undefined => {
    const { data: campaignTypes } = useGetCampaignTypes();
    return useMemo(
        () =>
            isPolioCampaign(campaign, campaignTypes as CampaignTypesDropdown[]),
        [campaign, campaignTypes],
    );
};

export const useIsPolioCampaignCheck = (): ((
    // eslint-disable-next-line no-unused-vars
    campaign?: CampaignFormValues,
) => boolean) => {
    const { data: campaignTypes } = useGetCampaignTypes();

    return useMemo(() => {
        return (campaign?: CampaignFormValues): boolean => {
            return isPolioCampaign(
                campaign,
                campaignTypes as CampaignTypesDropdown[],
            );
        };
    }, [campaignTypes]);
};
