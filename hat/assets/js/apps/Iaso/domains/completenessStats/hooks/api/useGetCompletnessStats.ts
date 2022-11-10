import { UseBaseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { CompletenessApiResponse, CompletenessStats } from '../../types';

const queryParamsMap = new Map([
    ['parentId', 'parent_id'],
    ['orgUnitTypeId', 'org_unit_type_id'],
    ['formId', 'form_id'],
]);

export type CompletenessGETParams = {
    parentId?: string;
    formId?: string;
    orgUnitTypeId?: string;
};

const getCompletenessStats = async (params: CompletenessGETParams) => {
    const queryParams = {};
    queryParamsMap.forEach((value, key) => {
        if (params[key]) {
            queryParams[value] = params[key];
        }
    });
    const queryString = new URLSearchParams(queryParams);
    return getRequest(`/api/completeness_stats/?${queryString}`);
};

export const useGetCompletenessStats = (
    params: CompletenessGETParams,
): UseBaseQueryResult<CompletenessStats[], unknown> => {
    return useSnackQuery({
        queryKey: ['completenessStats', params],
        queryFn: () => getCompletenessStats(params),
        options: {
            select: (data: CompletenessApiResponse): CompletenessStats[] => {
                return data.results;
            },
        },
    });
};
