import { useFormikContext } from 'formik';
import { useContext, useMemo } from 'react';
import { Campaign } from '../../../constants/types';
import FormAdditionalPropsContext from '../../../contexts/FormAdditionalPropsContext';
import { useGetCampaignTypes } from './api/useGetCampaignTypes';

export const useIsPolioCampaignCheck = (): boolean | undefined => {
    const { isFetchingSelectedCampaign } = useContext(
        FormAdditionalPropsContext,
    ) || { isFetching: false };
    const { data: campaignTypes } = useGetCampaignTypes();
    const { values } = useFormikContext<Campaign>();

    const isPolio = useMemo(() => {
        if (isFetchingSelectedCampaign) {
            return undefined;
        }
        return (
            campaignTypes?.some(
                type =>
                    type.value === 'polio' &&
                    values.campaign_types.includes(type.original?.id),
            ) ?? false
        );
    }, [campaignTypes, isFetchingSelectedCampaign, values.campaign_types]);

    return isPolio;
};
