import { UseBaseQueryResult } from 'react-query';

import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';
import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';

import { apiBaseUrl } from '../../constants';
import { ChronogramTaskApiResponse, ChronogramTasksParams } from '../types';

const getChronogramTasks = async (
    params: Partial<ChronogramTasksParams>,
): Promise<ChronogramTaskApiResponse> => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${apiBaseUrl}/tasks/?${queryString}`);
};

export const useGetChronogramTasks = (
    params: ChronogramTasksParams,
): UseBaseQueryResult<ChronogramTaskApiResponse, unknown> => {
    // Removed params with an undefined value.
    const cleanedParams: Partial<ChronogramTasksParams> = JSON.parse(
        JSON.stringify(params),
    );
    return useSnackQuery({
        queryKey: ['chronogramTasksList', cleanedParams],
        queryFn: () => getChronogramTasks(cleanedParams),
    });
};
