/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { PaginatedStorage, StorageDetailsParams } from '../../types/storages';

const getStorageLogs = async (
    options: StorageDetailsParams,
): Promise<PaginatedStorage> => {
    const {
        type,
        storageId,
        pageSize,
        operationType,
        performedAt,
        order,
        page,
    } = options as Record<string, any>;
    const baseUrl = `/api/storage/${type}/${storageId}/logs`;

    const apiParams = {
        limit: pageSize || 20,
        types: operationType,
        performed_at: performedAt,
        order,
        page,
    };

    const url = makeUrlWithParams(baseUrl, apiParams);
    return getRequest(url) as Promise<PaginatedStorage>;
};

export const useGetStorageLogs = (
    options: StorageDetailsParams,
): UseQueryResult<PaginatedStorage, Error> => {
    const queryKey: any[] = ['storageLog', options];
    const { select } = options as Record<string, any>;
    // @ts-ignore
    return useSnackQuery(queryKey, () => getStorageLogs(options), undefined, {
        select,
        enabled: Boolean(options.type) && Boolean(options.storageId),
    });
};
