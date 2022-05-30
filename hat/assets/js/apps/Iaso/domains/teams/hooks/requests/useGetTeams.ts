/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { Pagination } from '../../../../types/table';
import { TeamParams, TeamFilterParams, Team } from '../../types';

type TeamList = Pagination & {
    results: Team[];
};

const getTeams = async (
    options: TeamParams | TeamFilterParams,
): Promise<TeamList> => {
    const { pageSize, ...params } = options as Record<string, any>;
    if (pageSize) {
        params.limit = pageSize;
    }
    if (params.select) {
        delete params.select;
    }

    const url = makeUrlWithParams('/api/microplanning/teams', params);
    return getRequest(url) as Promise<TeamList>;
};

export const useGetTeams = (
    options: TeamParams | TeamFilterParams,
): UseQueryResult<TeamList, Error> => {
    const queryKey: any[] = ['teamsList', options];
    const { select } = options as Record<string, any>;
    // @ts-ignore
    return useSnackQuery(queryKey, () => getTeams(options), undefined, {
        select,
    });
};
