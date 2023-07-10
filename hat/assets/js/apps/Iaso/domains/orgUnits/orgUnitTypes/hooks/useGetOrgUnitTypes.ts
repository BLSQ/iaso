/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import {
    PaginatedOrgUnitTypes,
    OrgUnitTypesParams,
} from '../../types/orgunitTypes';

const getOrgUnitTypes = async (
    options: OrgUnitTypesParams,
): Promise<PaginatedOrgUnitTypes> => {
    const { pageSize, ...params } = options as Record<string, any>;
    if (pageSize) {
        params.limit = pageSize;
    }
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
