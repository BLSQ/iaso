import { UseQueryResult } from 'react-query';
import { useApiParams } from '../../hooks/useApiParams';
import { getRequest } from '../../libs/Api';
import { useSnackQuery } from '../../libs/apiHooks';

const apiUrl = '/api/datasources';
const tableDefaults = {
    order: 'name',
    page: 1,
    limit: 20,
};

const queryParamsMap = new Map([['projectIds', 'project_ids']]);

const getParams = (params: Record<string, string | undefined>) => {
    const queryParams: Record<string, string | undefined> = params;

    queryParamsMap.forEach((value, key) => {
        if (params[key]) {
            queryParams[value] = params[key];
            delete queryParams[key];
        }
    });

    return queryParams;
};
export const useGetDataSources = (
    params: Record<string, string | undefined>,
): UseQueryResult<any> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { accountId, ...tableParams } = getParams(params);
    const apiParams = useApiParams(tableParams, tableDefaults);
    const queryString = new URLSearchParams(apiParams).toString();
    return useSnackQuery({
        queryKey: ['sources', queryString],
        queryFn: () => getRequest(`${apiUrl}/?${queryString}`),
        options: {
            keepPreviousData: true,
            staleTime: 60000,
            cacheTime: 60000,
        },
    });
};
