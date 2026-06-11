import { UseQueryResult } from 'react-query';
import { PaginatedResponse } from '../../../../../../../../../hat/assets/js/apps/Iaso/domains/app/types';
import { getRequest } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { PaginationParams } from '../../../../../../../../../hat/assets/js/apps/Iaso/types/general';
import { Round } from '../../../../../constants/types';
import { SubActivityFormValues } from '../../types';

const apiUrl = '/api/polio/campaigns_subactivities';
type Args = {
    round?: Round;
    params: PaginationParams;
};

export const useGetSubActivities = ({
    round,
    params,
}: Args): UseQueryResult<PaginatedResponse<SubActivityFormValues>> => {
    const queryString = new URLSearchParams({
        ...params,
        round__id: `${round?.id}`,
    }).toString();
    const url = `${apiUrl}/?${queryString}`;
    return useSnackQuery({
        queryKey: ['subActivities', round?.id, queryString],
        queryFn: () => getRequest(url),
        options: {
            // Not keeping previous data as it would show wrong data when switching tabs to a round without subactivities
            staleTime: 60000,
            cacheTime: 45000,
            enabled: Boolean(round?.id),
        },
    });
};
