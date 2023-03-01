/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { PaginatedStorage, StorageDetailsParams } from '../../types/storages';

type ApiParams = {
    limit: string;
    order: string;
    page: string;
    types?: string;
    performed_at?: string;
    type: string;
    storageId: string;
};
type GetAPiParams = {
    url: string;
    apiParams: ApiParams;
};
export const useGetApiParams = (params: StorageDetailsParams): GetAPiParams => {
    const {
        pageSize,
        operationType,
        performedAt,
        order,
        page,
        type,
        storageId,
    }: StorageDetailsParams = params;
    const apiParams: ApiParams = {
        limit: pageSize || '20',
        types: operationType,
        performed_at: performedAt,
        order,
        page,
        type,
        storageId,
    };
    const baseUrl = `/api/storages/${type}/${storageId}/logs`;
    const url = makeUrlWithParams(baseUrl, apiParams);
    return {
        url,
        apiParams,
    };
};
const getStorageLogs = async (
    apiParams: ApiParams,
    baseUrl: string,
): Promise<PaginatedStorage> => {
    const url = makeUrlWithParams(baseUrl, apiParams);
    return getRequest(url) as Promise<PaginatedStorage>;
};

export const useGetStorageLogs = (
    options: StorageDetailsParams,
): UseQueryResult<PaginatedStorage, Error> => {
    const queryKey: any[] = ['storageLog', options];

    const { url, apiParams } = useGetApiParams(options);
    // @ts-ignore
    return useSnackQuery(
        queryKey,
        () => getStorageLogs(apiParams, url),
        undefined,
        {
            enabled: Boolean(options.type) && Boolean(options.storageId),
        },
    );
};
