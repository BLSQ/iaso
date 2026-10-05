import { Paginated } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import {
    Team,
    DropdownTeamsOptions,
    TeamDropdown,
    TeamUrlParams,
    TeamDropdownFilterParams,
} from '../../types/team';

export const DEFAULT_TEAMS_COLUMNS = [
    'id',
    'color',
    'name',
    'project_details',
    'type',
    'members_count',
];

export const NON_SELECTABLE_COLUMNS = ['actions', 'selection'];

const getCleanFields = (fields?: string | string[]): string | undefined => {
    const fieldsArray = Array.isArray(fields)
        ? fields
        : (fields?.split(',') ?? DEFAULT_TEAMS_COLUMNS);

    const filtered = fieldsArray.filter(
        f => f && !NON_SELECTABLE_COLUMNS.includes(f),
    );

    return filtered.length > 0 ? filtered.join(',') : undefined;
};

const getTeam = async (teamId?: number): Promise<Team> => {
    return getRequest(`/api/teams/${teamId}/`) as Promise<Team>;
};

export const useGetTeam = (teamId?: number): UseQueryResult<Team, Error> => {
    return useSnackQuery({
        queryKey: ['team', `team-${teamId}`],
        queryFn: () => getTeam(teamId),
        options: {
            enabled: Boolean(teamId),
            staleTime: Infinity,
            cacheTime: Infinity,
        },
    });
};

export type TeamList = Paginated<Team>;

const getTeams = async (options: TeamUrlParams): Promise<TeamList> => {
    const { pageSize, ...params } = options;
    const apiParams = {
        ...params,
        ...(pageSize ? { limit: pageSize } : {}),
        fields: getCleanFields(params.fields),
    };

    const url = makeUrlWithParams('/api/teams/', apiParams);
    return getRequest(url) as Promise<TeamList>;
};

export const useGetTeams = (
    options: TeamUrlParams,
): UseQueryResult<TeamList, Error> => {
    const queryKey = ['teamsList', options];
    return useSnackQuery(queryKey, () => getTeams(options), undefined, {
        staleTime: Infinity,
    });
};

const getTeamsDropdown = async (
    options: TeamDropdownFilterParams,
    fullTeams = false,
): Promise<TeamDropdown[] | Team[]> => {
    const path = fullTeams ? '/api/teams/' : '/api/teams/dropdown/';
    const url = makeUrlWithParams(path, options);
    return getRequest(url) as Promise<TeamDropdown[]>;
};

export const useGetTeamsDropdown = (
    options: TeamDropdownFilterParams,
    currentTeamId?: number,
    enabled = true,
    // This should be removed after planning page is refactored
    fullTeams = false,
): UseQueryResult<DropdownTeamsOptions[], Error> => {
    const queryKey: Array<string | typeof options> = ['teamsDropdown', options];
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

            keepPreviousData: true,
            staleTime: Infinity,
        },
    });
};
