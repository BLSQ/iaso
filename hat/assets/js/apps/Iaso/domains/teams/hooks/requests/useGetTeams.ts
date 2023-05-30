/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { Pagination } from 'bluesquare-components';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import {
    TeamParams,
    TeamFilterParams,
    Team,
    DropdownTeamsOptions,
} from '../../types/team';

type TeamList = Pagination & {
    results: Team[];
};

const getTeamsDropdown = async (
    options: TeamParams | TeamFilterParams,
): Promise<Team[]> => {
    const { ...params } = (options as Record<string, any>) ?? {};
    if (params.select) {
        delete params.select;
    }

    const url = makeUrlWithParams('/api/microplanning/teams/', params);
    return getRequest(url) as Promise<Team[]>;
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

export const useGetTeamsDropdown = (
    options: TeamParams | TeamFilterParams,
    currentTeamId?: number | undefined,
): UseQueryResult<DropdownTeamsOptions[], Error> => {
    const queryKey: any[] = ['teamsList', options];
    // @ts-ignore
    return useSnackQuery({
        queryKey,
        queryFn: () => getTeamsDropdown(options),
        options: {
            select: teams => {
                if (!teams) return [];
                const filteredTeams = teams.filter(
                    team => team.id !== currentTeamId,
                );
                return filteredTeams.map(team => {
                    return {
                        value: team.id,
                        label: team.name,
                        original: team,
                    };
                });
            },
        },
    });
};
