import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { useParamsObject } from '../../../routing/hooks/useParamsObject';
import { makeUrlWithParams } from '../../../libs/utils';

const getFormStats = url => {
    return getRequest(url);
};

type ApiParams = {
    project_ids?: string;
};

const useGetApiParams = (params: {
    accountId: string;
    projectIds: string;
}): ApiParams => ({
    project_ids: params.projectIds,
});

export const useGetFormStats = (
    baseUrl,
    url,
    queryKey,
): UseQueryResult<any, Error> => {
    const params = useParamsObject(baseUrl) as {
        accountId: string;
        projectIds: string;
    };
    const apiParams = useGetApiParams(params);
    const apiUrl = makeUrlWithParams(url, apiParams);
    return useSnackQuery({
        queryKey: [queryKey, params],
        queryFn: () => getFormStats(apiUrl),
        options: {
            staleTime: 60000,
            cacheTime: 60000,
            keepPreviousData: true,
        },
    });
};
