import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import {
    CampaignType,
    CampaignTypesDropdown,
} from '../../../../constants/types';

import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

export const useGetCampaignTypes = (
    useIds = false,
): UseQueryResult<CampaignTypesDropdown[], Error> => {
    return useSnackQuery({
        queryKey: ['campaign_types_dropdown'],
        queryFn: () =>
            getRequest('/api/polio/campaigns/available_campaign_types/'),
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
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
