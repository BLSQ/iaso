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
    const apiParams = useApiParams(
        { objectId, contentType },
        params ?? defaultTableParams,
    );
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
