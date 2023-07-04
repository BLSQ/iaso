import { UseBaseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { CompletenessApiResponse, CompletenessRouterParams } from '../../types';

// Correspondance between the name in the filter object and what the API expect
const queryParamsMap = new Map([
    ['orgUnitTypeIds', 'org_unit_type_ids'],
    ['formId', 'form_id'],
    ['parentId', 'parent_org_unit_id'],
    ['planningId', 'planning_id'],
    ['groupId', 'org_unit_group_id'],
    ['orgunitValidationStatus', 'org_unit_validation_status'],
]);

const apiParamsKeys = ['order', 'page', 'limit', 'search', 'period'];

export const buildQueryString = (
    params: CompletenessRouterParams,
): URLSearchParams => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pageSize, orgUnitTypeIds, formId, ...urlParams } = params;
    const apiParams = { ...urlParams, limit: pageSize ?? 10 };
    const queryParams = {};
    apiParamsKeys.forEach(apiParamKey => {
        const apiParam = apiParams[apiParamKey];
        if (apiParam !== undefined) {
            queryParams[apiParamKey] = apiParam;
        }
    });

    queryParamsMap.forEach((value, key) => {
        if (params[key]) {
            queryParams[value] = params[key];
        }
    });
    const queryString = new URLSearchParams(queryParams);
    return queryString;
};

const getCompletenessStats = async (
    params: CompletenessRouterParams,
): Promise<CompletenessApiResponse> => {
    const queryString = buildQueryString(params);
    return getRequest(`/api/v2/completeness_stats/?${queryString}`);
};

export const useGetCompletenessStats = (
    params: CompletenessRouterParams,
): UseBaseQueryResult<CompletenessApiResponse, unknown> => {
    return useSnackQuery({
        queryKey: ['completenessStats', params],
        queryFn: () => getCompletenessStats(params),
        options: {
            retry: 0,
            // Allow navigation via the action button to feel smooth
            //  otherwise it will blank the table then fill it.
            keepPreviousData: true,
        },
    });
};
