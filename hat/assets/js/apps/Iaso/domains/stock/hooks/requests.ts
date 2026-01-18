import { Pagination } from 'bluesquare-components';
import { UseMutationResult, UseQueryResult } from 'react-query';
import MESSAGES from 'Iaso/domains/stock/messages';
import { Params } from 'Iaso/domains/stock/types/filters';
import {
    StockKeepingUnit,
    StockRulesVersion,
} from 'Iaso/domains/stock/types/stocks';
import { PaginatedStockRuleVersions } from 'Iaso/domains/stock/versions/hooks/requests';
import {
    deleteRequest,
    getRequest,
    patchRequest,
    postRequest,
} from 'Iaso/libs/Api';
import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks';

import { makeUrlWithParams } from 'Iaso/libs/utils';

export interface PaginatedStockKeepingUnits extends Pagination {
    results: Array<StockKeepingUnit>;
}

type ApiParams = {
    limit?: string;
    order: string;
    page?: string;
    name?: string;
    short_name?: string;
    project_ids?: string;
    org_unit_type_ids?: string;
    created_by?: string;
};

type GetAPiParams = {
    url: string;
    apiParams: ApiParams;
};
export const useGetStockKeepingUnitsApiParams = (
    params: Params,
): GetAPiParams => {
    const apiParams: ApiParams = {
        order: params.order || 'id',
        name: params.search,
        short_name: params.search,
        project_ids: params.projectsIds,
        org_unit_type_ids: params.orgUnitTypeIds,
        created_by: params.created_by,
        limit: params.pageSize || '20',
        page: params.page || '1',
    };
    const url = makeUrlWithParams('/api/stockkeepingunits/', apiParams);
    return {
        url,
        apiParams,
    };
};

export const useGetStockKeepingUnitPaginated = (
    params: Params,
): UseQueryResult<PaginatedStockKeepingUnits, Error> => {
    const { url, apiParams } = useGetStockKeepingUnitsApiParams(params);
    return useSnackQuery({
        queryKey: ['stock_keeping_units', apiParams],
        queryFn: () => getRequest(url),
        options: {
            staleTime: 60000,
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
        },
    });
};

export const useDeleteSKU = (): UseMutationResult =>
    useSnackMutation(
        body => deleteRequest(`/api/stockkeepingunits/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['stock_keeping_units'],
    );

export const useSaveSku = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: body => {
            return body.id
                ? patchRequest(`/api/stockkeepingunits/${body.id}/`, body)
                : postRequest('/api/stockkeepingunits/', body);
        },
        invalidateQueryKey: ['stock_keeping_units'],
    });

const useGetPublishedStockRulesVersion = () => {
    return useSnackQuery({
        queryKey: ['stock_keeping_units'],
        queryFn: () =>
            getRequest(`/api/stockrulesversions/?status=PUBLISHED`).then(
                (result: PaginatedStockRuleVersions) => {
                    if (result.count !== 1) {
                        return undefined;
                    }
                    return result.results[0];
                },
            ),
        options: {
            retry: false,
            staleTime: Infinity,
        },
    });
};
export default useGetPublishedStockRulesVersion;
