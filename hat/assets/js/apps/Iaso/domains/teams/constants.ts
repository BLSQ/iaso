import {
    getApiTeamsDropdownListQueryKey,
    getApiTeamsListQueryKey,
    getApiTeamsTreeListQueryKey,
    Value8edEnum,
} from 'Iaso/api/teams';

export { Value8edEnum as TeamType };

export const TEAM_QUERY_KEYS = [
    getApiTeamsDropdownListQueryKey()[0],
    getApiTeamsListQueryKey()[0],
    getApiTeamsTreeListQueryKey()[0],
];
