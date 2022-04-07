import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { getRequest } from 'Iaso/libs/Api';
import { UseQueryResult } from 'react-query';
import { waitFor } from '../../../../../hat/assets/js/apps/Iaso/utils';
import { GroupedCampaigns } from '../constants/types';

const getGroupedCampaigns = async () => {
    await waitFor(1000);
    return {
        count: 1,
        results: [
            {
                id: 1,
                created_at: '2022-04-06T08:53:21.808038Z',
                updated_at: '2022-04-06T08:53:44.616365Z',
                name: 'Grouped Campaign 1',
                campaigns: [
                    {
                        id: '8ca37652-be39-40e7-be1c-11cf06aaa52e',
                        name: 'SEN-79DS-01-2021',
                    },
                    {
                        id: 'a76515b0-8d49-42cc-99f2-0c0d924f2df2',
                        name: 'MAU_57DS_08-2021',
                    },
                    {
                        id: '6613524b-1147-49bf-a669-36e97f697b0a',
                        name: 'GAM-65DS-06-2021',
                    },
                ],
            },
        ],
        has_next: false,
        has_previous: false,
        page: 1,
        pages: 1,
        limit: 20,
    };
};

export const useGetGroupedCampaigns = (): UseQueryResult<
    GroupedCampaigns,
    Error
> => {
    return useSnackQuery(
        ['groupedCampaigns'],
        () => getGroupedCampaigns(),
        undefined,
        {},
    );
};
