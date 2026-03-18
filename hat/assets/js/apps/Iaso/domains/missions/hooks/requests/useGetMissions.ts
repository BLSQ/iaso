import { Pagination } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { endpoint } from '../../constants';
import { Mission, MissionParams } from '../../types';

type MissionList = Pagination & {
    results: Mission[];
};

const getMissions = async (options: MissionParams): Promise<MissionList> => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    const { pageSize, search, missionType, accountId, ...params } =
        options as Record<string, any>;
    params.limit = pageSize ?? 20;
    if (search) {
        params.name__icontains = search;
    }
    if (missionType) {
        params.mission_type = missionType;
    }
    const url = makeUrlWithParams(endpoint, params);
    return getRequest(url) as Promise<MissionList>;
};

export const useGetMissions = (
    options: MissionParams,
): UseQueryResult<MissionList, Error> => {
    const queryKey: any[] = ['missionsList', options];
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getMissions(options),
        options: {
            keepPreviousData: true,
            cacheTime: 1000 * 60 * 5,
            staleTime: 1000 * 60 * 5,
        },
    });
};
