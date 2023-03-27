/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import {
    StoragePaginated,
    StorageFilterParams,
    StorageParams,
} from '../../types/storages';

const getStorage = async (
    options: StorageParams | StorageFilterParams,
): Promise<StoragePaginated> => {
    const { pageSize, ...params } = options as Record<string, any>;
    if (pageSize) {
        params.limit = pageSize;
    }
    const url = makeUrlWithParams('/api/storages/', params);
    return getRequest(url) as Promise<StoragePaginated>;
};

export const useGetStorages = (
    options: StorageParams | StorageFilterParams,
): UseQueryResult<StoragePaginated, Error> => {
    const queryKey: any[] = ['storageLog', options];
    const { select } = options as Record<string, any>;
    // @ts-ignore
    return useSnackQuery(queryKey, () => getStorage(options), undefined, {
        select,
    });
};
