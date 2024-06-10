import { UseQueryResult } from 'react-query';
import { getRequest } from '../libs/Api';
import { useSnackQuery } from '../libs/apiHooks';
import { useApiParams } from './useApiParams';

const defaultTableParams = {
    order: '-created_at',
    limit: 10,
    page: 1,
};
const apiUrl = '/api/logs';

const formatParams = (params, defaultParams) => {
    const { order, pageSize, page } = params;
    const tableParams = { ...defaultParams };
    if (order) {
        tableParams.order = params.order;
    }
    if (pageSize) {
        tableParams.limit = pageSize;
    }
    if (page) {
        tableParams.page = page;
    }
    return tableParams;
};

type Args = {
    objectId: number;
    contentType: string;
    params: any;
};
export const useGetLogs = ({
    objectId,
    contentType,
    params,
}: Args): UseQueryResult<any> => {
    const tableParams = formatParams(params, defaultTableParams);
    const apiParams = useApiParams({ objectId, contentType }, tableParams);
    const queryString = new URLSearchParams(apiParams).toString();
    return useSnackQuery({
        queryKey: ['logs', contentType, objectId, queryString],
        queryFn: () => getRequest(`${apiUrl}/?${queryString}`),
        options: {
            keepPreviousData: true,
            staleTime: 60000,
            cacheTime: 60000,
        },
    });
};
