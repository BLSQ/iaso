import { ApiParams } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { PaginatedResponse } from '../../../app/types';
import { SamplingResult } from '../../types';

export const tableDefaults = {
    page: 1,
    limit: 5,
    order: '-created_at',
};
export const useGetPlanningSamplingResults = (
    planningId: string,
    params: Record<string, string>,
): UseQueryResult<PaginatedResponse<SamplingResult>, Error> => {
    const safeParams = {
        page: params.page || tableDefaults.page,
        limit: params.pageSize || tableDefaults.limit,
        order: params.order || tableDefaults.order,
    } as ApiParams;
    const queryString = new URLSearchParams(safeParams).toString();
    return useSnackQuery({
        queryKey: ['planningSamplingResults', queryString, planningId],
        queryFn: () =>
            getRequest(
                `/api/microplanning/samplings/?planning_id=${planningId}&${queryString}`,
            ),

        options: {
            enabled: Boolean(planningId),
            retry: false,
            staleTime: Infinity,
            cacheTime: 60000,
        },
    });
};
