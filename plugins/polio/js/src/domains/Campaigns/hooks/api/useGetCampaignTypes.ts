import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { CampaignType } from '../../../../constants/types';

import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

export const useGetCampaignTypes = (): UseQueryResult<
    DropdownOptions<string>[],
    Error
> => {
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
                            value: campaignType.slug,
                            label: campaignType.name,
                            original: campaignType,
                        };
                    }) ?? []
                );
            },
        },
    });
};
