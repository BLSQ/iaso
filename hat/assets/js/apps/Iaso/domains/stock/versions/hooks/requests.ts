import { Pagination } from 'bluesquare-components';
import { UseMutationResult, UseQueryResult } from 'react-query';
import MESSAGES from 'Iaso/domains/stock/messages';
import { Status, StockRulesVersion } from 'Iaso/domains/stock/types/stocks';
import {
    deleteRequest,
    getRequest,
    patchRequest,
    postRequest,
} from 'Iaso/libs/Api';
import { useSnackMutation, useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { Params } from '../types/filters';

export interface PaginatedStockRuleVersions extends Pagination {
    results: Array<StockRulesVersion>;
}

type ApiParams = {
    version_id?: number;
    limit?: string;
    order: string;
    page?: string;
    name?: string;
    status?: Status;
    sku_id?: number;
    form_id?: number;
};

type GetAPiParams = {
    url: string;
    apiParams: ApiParams;
};
export const useGetStockRulesVersionsApiParams = (
    params: Params,
): GetAPiParams => {
    const apiParams: ApiParams = {
        order: params.order || '-id',
        name: params.search,
        status: params.status,
        limit: params.pageSize || '20',
        page: params.page || '1',
    };
    const url = makeUrlWithParams('/api/stockrulesversions/', apiParams);
    return {
        url,
        apiParams,
    };
};

export const useGetStockRulesVersionsPaginated = (
    params: Params,
): UseQueryResult<PaginatedStockRuleVersions, Error> => {
    const { url, apiParams } = useGetStockRulesVersionsApiParams(params);
    return useSnackQuery({
        queryKey: ['stock_rules_versions', apiParams],
        queryFn: () => getRequest(url),
        options: {
            staleTime: 60000,
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
        },
    });
};

export const useDeleteStockRulesVersion = (): UseMutationResult =>
    useSnackMutation(
        body => deleteRequest(`/api/stockrulesversions/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['stock_rules_versions'],
    );

export const useUpdateStockRulesVersion = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: body =>
            patchRequest(`/api/stockrulesversions/${body.id}/`, body),
        invalidateQueryKey: ['stock_rules_versions'],
        showSuccessSnackBar: true,
    });

export const useCopyStockRulesVersion = (): UseMutationResult =>
    useSnackMutation({
        mutationFn: body =>
            postRequest(`/api/stockrulesversions/${body.id}/copy/`),
        invalidateQueryKey: ['stock_rules_versions'],
    });

export const useCreateStockRulesVersion = (
    closeDialog: () => void,
): UseMutationResult =>
    useSnackMutation({
        mutationFn: body => postRequest(`/api/stockrulesversions/`, body),
        invalidateQueryKey: ['stock_rules_versions'],
        options: { onSuccess: closeDialog },
    });

const getStockRulesVersion = (
    id: number | undefined,
): Promise<StockRulesVersion> => {
    return getRequest(`/api/stockrulesversions/${id}/`);
};
export const useGetStockRulesVersion = (
    id: number | undefined,
): UseQueryResult<StockRulesVersion, Error> => {
    const queryKey: any[] = ['stock_rules_versions', id];
    return useSnackQuery({
        queryKey,
        queryFn: () => getStockRulesVersion(id),
        options: {
            retry: false,
            staleTime: Infinity,
        },
    });
};

export const useGetStockItemRulesApiParams = (
    version: number,
    params: Params,
): GetAPiParams => {
    const apiParams: ApiParams = {
        version_id: version,
        order: params.order || 'id',
        name: params.search,
        limit: params.pageSize || '20',
        page: params.page || '1',
        sku_id: params.skuId,
        form_id: params.formId,
    };
    const url = makeUrlWithParams('/api/stockitemrules/', apiParams);
    return {
        url,
        apiParams,
    };
};

export const useGetStockItemRulesPaginated = (
    version: number,
    params: Params,
): UseQueryResult<PaginatedStockRuleVersions, Error> => {
    const { url, apiParams } = useGetStockItemRulesApiParams(version, params);
    return useSnackQuery({
        queryKey: ['stock_item_rules', apiParams],
        queryFn: () => getRequest(url),
        options: {
            staleTime: 60000,
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
        },
    });
};

export const useSaveStockItemRule = (
    versionId: number,
    closeDialog: () => void = () => {},
): UseMutationResult =>
    useSnackMutation({
        mutationFn: body => {
            return body.id
                ? patchRequest(`/api/stockitemrules/${body.id}/`, {
                      ...body,
                      version: versionId,
                  })
                : postRequest(`/api/stockitemrules/`, {
                      ...body,
                      version: versionId,
                  });
        },
        invalidateQueryKey: ['stock_item_rules', versionId],
        options: { onSuccess: closeDialog },
    });

export const useDeleteStockItemRule = (): UseMutationResult =>
    useSnackMutation(
        body => deleteRequest(`/api/stockitemrules/${body.id}/`),
        MESSAGES.deleteSuccess,
        MESSAGES.deleteError,
        ['stock_item_rules'],
    );
