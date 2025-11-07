import { Pagination } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import {
    TeamParams,
    TeamFilterParams,
    Team,
    DropdownTeamsOptions,
    TeamDropdown,
} from '../../types/team';

const getTeam = async (teamId: number): Promise<Team> => {
    return getRequest(`/api/teams/${teamId}/`) as Promise<Team>;
};
export const useGetTeam = (teamId: number): UseQueryResult<Team, Error> => {
    return useSnackQuery({
        queryKey: ['team', teamId],
        queryFn: () => getTeam(teamId),
        options: {
            enabled: Boolean(teamId),
        },
    });
};

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

    const url = makeUrlWithParams('/api/teams', params);
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

const getTeamsDropdown = async (
    options: TeamParams | TeamFilterParams,
    fullTeams = false,
): Promise<TeamDropdown[] | Team[]> => {
    const { ...params } = (options as Record<string, any>) ?? {};
    if (params.select) {
        delete params.select;
    }
    const path = fullTeams ? '/api/teams/' : '/api/teams/dropdown/';
    const url = makeUrlWithParams(path, params);
    return getRequest(url) as Promise<TeamDropdown[] | Team[]>;
};
export const useGetTeamsDropdown = (
    options: TeamParams | TeamFilterParams,
    currentTeamId?: number,
    enabled = true,
    // This should be removed after planning page is refactored
    fullTeams = false,
): UseQueryResult<DropdownTeamsOptions[], Error> => {
    const queryKey: any[] = ['teamsList', options, currentTeamId];
    return useSnackQuery({
        queryKey,
        queryFn: () => getTeamsDropdown(options, fullTeams),
        options: {
            enabled,
            select: teams => {
                if (!teams) return [];
                const filteredTeams = teams.filter(
                    team => team.id !== currentTeamId,
                );
                return filteredTeams.map((team: TeamDropdown | Team) => {
                    return {
                        value: team.id.toString(),
                        label: team.name,
                        original: fullTeams
                            ? (team as Team)
                            : (team as TeamDropdown),
                        color: team.color,
                    };
                });
            },
        },
    });
};
