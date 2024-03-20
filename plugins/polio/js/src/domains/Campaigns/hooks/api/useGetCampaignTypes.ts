import { UseQueryResult } from 'react-query';
import { CampaignType } from '../../../../constants/types';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { DropdownOptions } from '../../../../../../../../hat/assets/js/apps/Iaso/types/utils';

export const useGetCampaignTypes = (): UseQueryResult<
    DropdownOptions<number>[],
    Error
> => {
    return useSnackQuery({
        queryKey: ['campaign_types_dropdown'],
        queryFn: () =>
            getRequest('/api/polio/campaigns/available_campaign_types/'),
        options: {
            select: data => {
                return (
                    data?.map((campaignType: CampaignType) => {
                        return {
                            value: campaignType.id,
                            label: campaignType.name,
                            original: campaignType,
                        };
                    }) ?? []
                );
            },
        },
    });
};
