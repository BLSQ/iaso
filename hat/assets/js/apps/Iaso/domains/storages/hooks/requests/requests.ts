import { makeUrlWithParams } from '../../../../libs/utils';

import { StorageParams } from '../../types/storages';

type GetAPiParams = {
    url: string;
    apiParams: StorageParams;
};
export const useGetStorageApiParams = (params: StorageParams): GetAPiParams => {
    const apiParams: StorageParams = {
        order: params.order,
        page: params.page,
        pageSize: params.pageSize,
        reason: params.reason,
        search: params.search,
        status: params.status,
        type: params.type,
    };
    const url = makeUrlWithParams('/api/storage/', apiParams);
    return {
        url,
        apiParams,
    };
};
