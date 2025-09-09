import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../libs/utils';
import { ApiFormStatsParams } from '../types/formStats';

const getFormStats = url => {
    return getRequest(url);
};

const useGetFormStats = ({
    params,
    url,
    queryKey,
}: ApiFormStatsParams): UseQueryResult<any, Error> => {
    const apiParams = { project_ids: params.projectIds };
    const apiUrl = makeUrlWithParams(url, apiParams);
    return useSnackQuery({
        queryKey: [queryKey, apiUrl],
        queryFn: () => getFormStats(apiUrl),
        options: {
            staleTime: 60000,
            cacheTime: 60000,
            keepPreviousData: true,
        },
    });
};

export const useGetPerFormStats = params => {
    return useGetFormStats({
        params,
        url: '/api/instances/stats/',
        queryKey: ['instances', 'stats'],
    });
};

export const useGetFormStatsSum = params => {
    return useGetFormStats({
        params,
        url: '/api/instances/stats_sum/',
        queryKey: ['instances', 'stats_sum'],
    });
};
