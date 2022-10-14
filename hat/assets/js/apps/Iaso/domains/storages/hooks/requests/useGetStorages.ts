/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
// import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
// import { makeUrlWithParams } from '../../../../libs/utils';
import {
    StoragePaginated,
    StorageFilterParams,
    StorageParams,
} from '../../types/storages';

import { Storages } from './fixtures';

const getStorage = async (
    options: StorageParams | StorageFilterParams,
): Promise<StoragePaginated> => {
    const { pageSize, ...params } = options as Record<string, any>;
    if (pageSize) {
        params.limit = pageSize;
    }
    if (params.select) {
        delete params.select;
    }

    // const url = makeUrlWithParams('/api/storage', params);
    // return getRequest(url) as Promise<StoragePaginated>;
    return new Promise(resolve => resolve(Storages));
};

export const useGetStorages = (
    options: StorageParams | StorageFilterParams,
): UseQueryResult<StoragePaginated, Error> => {
    const queryKey: any[] = ['storageList', options];
    const { select } = options as Record<string, any>;
    // @ts-ignore
    return useSnackQuery(queryKey, () => getStorage(options), undefined, {
        select,
    });
};
