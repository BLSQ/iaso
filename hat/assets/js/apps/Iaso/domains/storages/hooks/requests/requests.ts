import { makeUrlWithParams } from '../../../../libs/utils';

import { StorageParams } from '../../types/storages';

type GetAPiParams = {
    url: string;
    apiParams: StorageParams;
};
export const useGetStorageApiParams = (params: StorageParams): GetAPiParams => {
    const apiParams: Omit<StorageParams, 'select'> = {
        order: params.order,
        page: params.page,
        pageSize: params.pageSize,
        reason: params.reason,
        search: params.search,
        status: params.status,
        type: params.type,
    };
    const url = makeUrlWithParams('/api/storages/', apiParams);
    return {
        url,
        apiParams,
    };
};
