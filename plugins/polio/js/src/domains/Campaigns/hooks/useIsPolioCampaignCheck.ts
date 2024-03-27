import { useContext, useMemo } from 'react';
import { CampaignFormValues } from '../../../constants/types';
import FormAdditionalPropsContext from '../../../contexts/FormAdditionalPropsContext';
import { useGetCampaignTypes } from './api/useGetCampaignTypes';

export const useIsPolioCampaignCheck = (): ((
    // eslint-disable-next-line no-unused-vars
    campaign?: CampaignFormValues,
) => boolean | undefined) => {
    const { isFetchingSelectedCampaign } = useContext(
        FormAdditionalPropsContext,
    ) || { isFetching: false };
    const { data: campaignTypes } = useGetCampaignTypes();

    return useMemo(() => {
        if (isFetchingSelectedCampaign) {
            return () => undefined;
        }
        return (campaign: CampaignFormValues): boolean | undefined => {
            return (
                campaignTypes?.some(
                    type =>
                        type.value === 'polio' &&
                        campaign?.campaign_types?.includes(type.original?.id),
                ) ?? false
            );
        };
    }, [campaignTypes, isFetchingSelectedCampaign]);
};
