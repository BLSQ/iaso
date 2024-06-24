import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';

const apiUrl = '/api/orgunits';
export const tableDefaults = {
    limit: 10,
    page: 1,
    order: 'name',
    validation_status: 'all',
};

export const useGetOrgUnitChildren = (
    queryString: string,
): UseQueryResult<any> => {
    return useSnackQuery({
        queryKey: ['orgUnit-children', queryString],
        queryFn: () => getRequest(`${apiUrl}/?${queryString}`),
        options: {
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
        },
    });
};
