import { UseBaseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { UrlParams } from '../../../../types/table';
import { CompletenessApiResponse } from '../../types';

const queryParamsMap = new Map([
    ['orgUnitId', 'org_unit_id'],
    ['orgUnitTypeId', 'org_unit_type_id'],
    ['formId', 'form_id'],
]);

export type CompletenessGETParams = UrlParams & {
    orgUnitId?: string;
    formId?: string;
    orgUnitTypeId?: string;
};

const apiParamsKeys = ['order', 'page', 'limit', 'search'];

const getCompletenessStats = async (
    params: CompletenessGETParams,
): Promise<CompletenessApiResponse> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pageSize, orgUnitId, orgUnitTypeId, formId, ...urlParams } = params;
    const apiParams = { ...urlParams, limit: pageSize ?? 50 };
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
    return getRequest(`/api/completeness_stats/?${queryString}`);
};

export const useGetCompletenessStats = (
    params: CompletenessGETParams,
): UseBaseQueryResult<CompletenessApiResponse, unknown> => {
    return useSnackQuery({
        queryKey: ['completenessStats', params],
        queryFn: () => getCompletenessStats(params),
    });
};
