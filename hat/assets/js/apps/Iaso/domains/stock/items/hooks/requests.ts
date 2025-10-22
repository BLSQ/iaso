import { Pagination } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { Impact, StockItem } from 'Iaso/domains/stock/types/stocks';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { Params } from '../types/filters';

export interface PaginatedStockItems extends Pagination {
    results: Array<StockItem>;
}

type ApiParams = {
    id?: number;
    limit?: string;
    order: string;
    page?: string;
    sku_id?: number;
    org_unit_id?: number;
    value?: number;
    question?: string;
    impact?: Impact;
    created_at_after?: string;
    created_at_before?: string;
    value_from?: number;
    value_to?: number;
};

type GetAPiParams = {
    url: string;
    apiParams: ApiParams;
};
export const useGetStockItemsApiParams = (params: Params): GetAPiParams => {
    const apiParams: ApiParams = {
        order: params.order || 'sku_id',
        limit: params.pageSize || '20',
        page: params.page || '1',
        sku_id: params.sku,
        org_unit_id: params.orgUnit,
    };
    const url = makeUrlWithParams('/api/stockitems/', apiParams);
    return {
        url,
        apiParams,
    };
};

export const useGetStockItemsPaginated = (
    params: Params,
): UseQueryResult<PaginatedStockItems, Error> => {
    const { url, apiParams } = useGetStockItemsApiParams(params);
    return useSnackQuery({
        queryKey: ['stock_items', apiParams],
        queryFn: () => getRequest(url),
    });
};

export const useGetStockItem = (
    id: number,
): UseQueryResult<StockItem, Error> => {
    return useSnackQuery({
        queryKey: ['stock_items', id],
        queryFn: () => getRequest(`/api/stockitems/${id}/`),
    });
};

export const useGetStockItemLogsApiParams = (
    params: Params,
    stockItem?: StockItem,
): GetAPiParams => {
    const apiParams: ApiParams = {
        order: params.order || '-created_at',
        limit: params.pageSize || '20',
        page: params.page || '1',
        sku_id: stockItem?.sku?.id,
        org_unit_id: stockItem?.org_unit?.id,
        value: params.value,
        question: params.question,
        impact: params.impact,
        created_at_after: params.created_at_after,
        created_at_before: params.created_at_before,
        value_from: params.value_from,
        value_to: params.value_to,
    };
    const url = makeUrlWithParams(`/api/stockledgeritems/`, apiParams);
    return {
        url,
        apiParams,
    };
};

export const useGetStockLedgerItemsPaginated = (
    params: Params,
    stockItem?: StockItem,
): UseQueryResult<PaginatedStockItems, Error> => {
    const { url, apiParams } = useGetStockItemLogsApiParams(params, stockItem);
    return useSnackQuery({
        queryKey: ['stock_ledger_items', apiParams],
        queryFn: () => {
            if (stockItem == null) {
                return undefined;
            }
            return getRequest(url);
        },
    });
};
