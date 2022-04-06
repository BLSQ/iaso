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
                name: 'MaCampagne de test',
                'campa igns': [
                    '2f6c7102-ed46-465f-be87-046dd74fcc7d',
                    'b5a83d40-e83d-49ef-a93e-d536baf82d11',
                    '7b93892b-23a5-4fd8-bff5-0a14f35841fd',
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
