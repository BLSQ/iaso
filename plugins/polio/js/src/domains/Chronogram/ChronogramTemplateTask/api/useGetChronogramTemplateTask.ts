import { UseBaseQueryResult } from 'react-query';

import { getRequest } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/Api';
import { useSnackQuery } from '../../../../../../../../hat/assets/js/apps/Iaso/libs/apiHooks';

import { apiBaseUrl } from '../../constants';
import {
    ChronogramTemplateTaskApiResponse,
    ChronogramTemplateTaskParams,
} from '../types';

const getChronogramTemplateTask = async (
    params: Partial<ChronogramTemplateTaskParams>,
): Promise<ChronogramTemplateTaskApiResponse> => {
    const queryString = new URLSearchParams(params).toString();
    return getRequest(`${apiBaseUrl}/template_tasks/?${queryString}`);
};

export const useGetChronogramTemplateTask = (
    params: ChronogramTemplateTaskParams,
): UseBaseQueryResult<ChronogramTemplateTaskApiResponse, unknown> => {
    // Removed params with an undefined value.
    const cleanedParams: Partial<ChronogramTemplateTaskParams> = JSON.parse(
        JSON.stringify(params),
    );
    return useSnackQuery({
        queryKey: ['chronogramTemplateTaskList', cleanedParams],
        queryFn: () => getChronogramTemplateTask(cleanedParams),
    });
};
