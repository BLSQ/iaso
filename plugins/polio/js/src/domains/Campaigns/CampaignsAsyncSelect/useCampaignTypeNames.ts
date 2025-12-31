import { useGetCampaignTypes } from '../hooks/api/useGetCampaignTypes';

export const useCampaignTypeNames = (
    campaignType: 'polio' | 'non-polio' | string,
): string | undefined => {
    const { data: types } = useGetCampaignTypes();
    if (campaignType === 'non-polio') {
        return (types ?? [])
            .filter(typeOption => typeOption.value !== 'polio')
            .map(typeOption => typeOption.value)
            .join(',');
    }
    return (types ?? []).find(type => type.value === campaignType)?.value;
};
