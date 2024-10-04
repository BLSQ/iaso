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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { accountId, ...tableParams } = params;
    const apiParams = useApiParams(tableParams, tableDefaults);
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
