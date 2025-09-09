import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import {
    OrgUnitTypesParams,
    PaginatedOrgUnitTypes,
} from '../../types/orgunitTypes';

const queryParamsMap = new Map([['projectIds', 'project_ids']]);
const apiParamsKeys = ['order', 'page', 'limit', 'search', 'with_units_count'];

const getParams = (params: OrgUnitTypesParams) => {
    const { pageSize, ...urlParams } = params;
    const apiParams: Record<string, any> = {
        ...urlParams,
        limit: pageSize ?? 10,
    };

    const queryParams: Record<string, string> = {};
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

    return queryParams;
};

const getOrgUnitTypes = async (
    options: OrgUnitTypesParams,
): Promise<PaginatedOrgUnitTypes> => {
    const params = getParams(options);
    const url = makeUrlWithParams('/api/v2/orgunittypes/', params);
    return getRequest(url) as Promise<PaginatedOrgUnitTypes>;
};

export const useGetOrgUnitTypes = (
    options: OrgUnitTypesParams,
): UseQueryResult<PaginatedOrgUnitTypes, Error> => {
    const queryKey: any[] = ['paginated-orgunit-types', options];
    return useSnackQuery({
        queryKey,
        queryFn: () => getOrgUnitTypes(options),
    });
};
