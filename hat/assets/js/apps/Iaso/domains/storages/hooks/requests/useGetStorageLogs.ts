/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import {
    PaginatedStorage,
    StorageFilterParams,
    StorageParams,
} from '../../types/storages';

const getStorageLogs = async (
    options: StorageParams | StorageFilterParams,
): Promise<PaginatedStorage> => {
    const { pageSize, ...params } = options as Record<string, any>;
    params.limit = pageSize || 20;

    const url = makeUrlWithParams(
        `/api/storage/${params.type}/${params.storageId}/logs`,
        params,
    );
    return getRequest(url) as Promise<PaginatedStorage>;
};

export const useGetStorageLogs = (
    options: StorageParams | StorageFilterParams,
): UseQueryResult<PaginatedStorage, Error> => {
    const queryKey: any[] = ['storageLog', options];
    const { select } = options as Record<string, any>;
    // @ts-ignore
    return useSnackQuery(queryKey, () => getStorageLogs(options), undefined, {
        select,
        enabled: Boolean(options.type) && Boolean(options.storageId),
    });
};
