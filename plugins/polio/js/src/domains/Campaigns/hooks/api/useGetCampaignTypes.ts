import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import {
    CampaignType,
    CampaignTypesDropdown,
} from '../../../../constants/types';

export const useGetCampaignTypes = (
    useIds = false,
): UseQueryResult<CampaignTypesDropdown[], Error> => {
    return useSnackQuery({
        queryKey: ['campaign_types_dropdown'],
        queryFn: () =>
            getRequest('/api/polio/campaigns/available_campaign_types/'),
        options: {
            staleTime: Infinity, // in MS
            cacheTime: Infinity,
            keepPreviousData: true,
            select: data => {
                return (
                    data?.map((campaignType: CampaignType) => {
                        return {
                            value: useIds ? campaignType.id : campaignType.slug,
                            label: campaignType.name,
                            original: campaignType,
                        };
                    }) ?? []
                );
            },
        },
    });
};
