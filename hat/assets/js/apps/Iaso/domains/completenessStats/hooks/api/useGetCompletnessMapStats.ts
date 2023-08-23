import { UseBaseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import {
    CompletenessMapApiResponse,
    CompletenessRouterParams,
    CompletenessMapStats,
} from '../../types';

// Correspondance between the name in the filter object and what the API expect
const queryParamsMap = new Map([
    ['orgUnitTypeIds', 'org_unit_type_ids'],
    ['formId', 'form_id'],
    ['parentId', 'parent_org_unit_id'],
    ['planningId', 'planning_id'],
    ['groupId', 'org_unit_group_id'],
    ['orgunitValidationStatus', 'org_unit_validation_status'],
]);

const getParams = (params: CompletenessRouterParams) => {
    const queryParams = {};
    queryParamsMap.forEach((value, key) => {
        if (params[key]) {
            queryParams[value] = params[key];
        }
    });
    return queryParams;
};

export const buildQueryString = (
    params: CompletenessRouterParams,
): URLSearchParams => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const queryParams = {};
    queryParamsMap.forEach((value, key) => {
        if (params[key]) {
            queryParams[value] = params[key];
        }
    });
    const queryString = new URLSearchParams(getParams(params));
    return queryString;
};

const getCompletenessStats = async (
    params: CompletenessRouterParams,
): Promise<CompletenessMapApiResponse> => {
    const queryString = buildQueryString(params);
    return getRequest(`/api/v2/completeness_stats/?${queryString}`);
};

export const useGetCompletnessMapStats = (
    params: CompletenessRouterParams,
    enabled: boolean,
): UseBaseQueryResult<CompletenessMapStats[], unknown> => {
    return useSnackQuery({
        queryKey: ['completenessMapStats', getParams(params)],
        queryFn: () => getCompletenessStats(params),
        options: {
            retry: 0,
            // Allow navigation via the action button to feel smooth
            //  otherwise it will blank the table then fill it.
            keepPreviousData: true,
            select: data => data?.results,
            enabled,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};
