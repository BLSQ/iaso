import { useApiParams } from '../../../hooks/useApiParams';
import { useUrlParams } from '../../../hooks/useUrlParams';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';

const defaults = {
    order: undefined,
    pageSize: 20,
    page: 1,
};

const apiUrl = '/api/userlogs/';

export const useGetUsersHistory = params => {
    const safeParams = useUrlParams(params, defaults);
    const apiParams = useApiParams(safeParams);
    // `fields` only drives column visibility in the UI, the API doesn't support it
    const cleanApiParams = { ...(apiParams as Record<string, any>) };
    delete cleanApiParams.fields;
    const queryString = new URLSearchParams(cleanApiParams).toString();
    const url = `${apiUrl}?${queryString}`;
    return useSnackQuery({
        queryKey: ['usersHistoryList', url],
        queryFn: () => getRequest(url),
        options: {
            retry: false,
            keepPreviousData: true,
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
        },
    });
};
