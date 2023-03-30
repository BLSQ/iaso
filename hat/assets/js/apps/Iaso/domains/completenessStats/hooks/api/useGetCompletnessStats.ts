import { UseBaseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { UrlParams } from '../../../../types/table';
import { CompletenessApiResponse } from '../../types';

const queryParamsMap = new Map([
    ['orgUnitId', 'org_unit_id'],
    ['orgUnitTypeIds', 'org_unit_type_id'],
    ['formId', 'form_id'],
    ['parentId', 'parent_org_unit_id'],
    ['planningId', 'planning_id'],
]);

export type CompletenessGETParams = UrlParams & {
    orgUnitId?: string;
    formId?: string;
    orgUnitTypeIds?: string;
    period?: string;
};

const apiParamsKeys = ['order', 'page', 'limit', 'search', 'period'];

export const buildQueryString = (
    params: UrlParams & {
        orgUnitId?: string;
        formId?: string;
        orgUnitTypeIds?: string;
        period?: string;
    },
) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pageSize, orgUnitId, orgUnitTypeIds, formId, ...urlParams } =
        params;
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
    params: CompletenessGETParams,
): Promise<CompletenessApiResponse> => {
    const queryString = buildQueryString(params);
    return getRequest(`/api/v2/completeness_stats/?${queryString}`);
};

export const useGetCompletenessStats = (
    params: CompletenessGETParams,
): UseBaseQueryResult<CompletenessApiResponse, unknown> => {
    return useSnackQuery({
        queryKey: ['completenessStats', params],
        queryFn: () => getCompletenessStats(params),
        options: {
            retry: 0,
        },
    });
};
