import { UseQueryResult } from 'react-query';
import { useApiParams } from '../../../../hooks/useApiParams';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

const apiUrl = '/api/devices';
export const tableDefaults = {
    page: 1,
    limit: 20,
    order: 'name',
};

export const useGetDevices = (
    params: Record<string, string>,
): UseQueryResult<any> => {
    const apiParams = useApiParams(params, tableDefaults);
    const queryString = new URLSearchParams(apiParams).toString();
    return useSnackQuery({
        queryKey: ['devices', queryString],
        queryFn: () => getRequest(`${apiUrl}/?${queryString}`),
        options: {
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
        },
    });
};
