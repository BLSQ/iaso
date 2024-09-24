import { UseQueryResult } from 'react-query';
import { getRequest } from '../libs/Api';
import { useSnackQuery } from '../libs/apiHooks';

export const useGetLogDetails = (
    logId: string | number,
    apiKey = 'logs',
): UseQueryResult<any> => {
    return useSnackQuery({
        queryKey: [apiKey, logId],
        queryFn: () => getRequest(`/api/${apiKey}/${logId}/`),
        options: {
            keepPreviousData: true,
            staleTime: 60000,
            cacheTime: 60000,
        },
    });
};
