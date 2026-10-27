import { getApiTeamsTreeListQueryKey } from 'Iaso/api/teams';

export const TEAM_OF_TEAMS = 'TEAM_OF_TEAMS';
export const TEAM_OF_USERS = 'TEAM_OF_USERS';

export enum TeamType {
    TEAM_OF_USERS = 'TEAM_OF_USERS',
    TEAM_OF_TEAMS = 'TEAM_OF_TEAMS',
}

export const TEAM_QUERY_KEYS = [
    'teamsList',
    'teamsDropdown',
    'team',
    getApiTeamsTreeListQueryKey()[0],
];
