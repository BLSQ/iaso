import { UseQueryResult } from 'react-query';
import { getRequest } from '../libs/Api';
import { useSnackQuery } from '../libs/apiHooks';

export const useGetLogDetails = (
    logId: string | number,
): UseQueryResult<any> => {
    return useSnackQuery({
        queryKey: ['log-details', logId],
        queryFn: () => getRequest(`/api/logs/${logId}/`),
        options: {
            keepPreviousData: true,
            staleTime: 60000,
            cacheTime: 60000,
        },
    });
};
