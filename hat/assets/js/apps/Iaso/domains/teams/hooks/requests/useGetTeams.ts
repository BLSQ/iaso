/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { Pagination } from '../../../../types/table';
import { TeamParams } from '../../types';

type UserDetails = {
    id: number;
    username: number;
};
type SubTeamDetails = {
    id: number;
    name: number;
};

type Team = {
    id: number;
    project: number;
    name: string;
    description?: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string;
    users: Array<number>;
    users_details: Array<UserDetails>;
    manager: number;
    parent?: number;
    sub_teams: Array<number>;
    sub_teams_details: Array<SubTeamDetails>;
};

type TeamList = Pagination & {
    results: Team[];
};

const getTeams = async (options: TeamParams): Promise<TeamList> => {
    // assigning the variables allows us to have a params object without the unwanted keys
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { pageSize, ...params } = options as Record<string, any>;
    params.limit = options?.pageSize;

    const url = makeUrlWithParams('/api/microplanning/teams', params);
    return getRequest(url) as Promise<TeamList>;
};

export const useGetTeams = (
    options: TeamParams,
): UseQueryResult<TeamList, Error> => {
    const queryKey: any[] = ['teamsList', options];
    // @ts-ignore
    return useSnackQuery(queryKey, () => getTeams(options));
};
