import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { PaginatedStorage, StorageDetailsParams } from '../../types/storages';

type ApiParams = {
    limit: string;
    order: string;
    page: string;
    types?: string;
    performed_at?: string;
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
    }: StorageDetailsParams = params;
    const apiParams: ApiParams = {
        limit: pageSize || '20',
        types: operationType,
        performed_at: performedAt,
        order,
        page,
    };
    const baseUrl = `/api/storages/${params.type}/${params.storageId}/logs`;
    return {
        url: baseUrl,
        apiParams,
    };
};
const getStorageLogs = async (
    apiParams: ApiParams,
    baseUrl: string,
): Promise<PaginatedStorage> => {
    const url = makeUrlWithParams(baseUrl, apiParams);
    return await getRequest(url);
};

export const useGetStorageLogs = (
    options: StorageDetailsParams,
): UseQueryResult<PaginatedStorage, Error> => {
    const queryKey: any[] = ['storageLog', options];

    const { url, apiParams } = useGetApiParams(options);
    return useSnackQuery(
        queryKey,
        () => getStorageLogs(apiParams, url),
        undefined,
        {
            enabled: Boolean(options.type) && Boolean(options.storageId),
        },
    );
};
