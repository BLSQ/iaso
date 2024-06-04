import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { useOrgUnitChildrenQueryString } from '../../details/Children/useOrgUnitChildrenQueryString';

const apiUrl = '/api/orgunits';
export const tableDefaults = {
    limit: 10,
    page: 1,
    order: 'name',
    validation_status: 'all',
};

export const useGetOrgUnitChildren = params => {
    const queryString = useOrgUnitChildrenQueryString(params);
    return useSnackQuery({
        queryKey: ['orgUnit-children', params?.orgUnitId, queryString],
        queryFn: () => getRequest(`${apiUrl}/?${queryString}`),
        options: {
            keepPreviousData: true,
            cacheTime: 60000,
            staleTime: 60000,
        },
    });
};
