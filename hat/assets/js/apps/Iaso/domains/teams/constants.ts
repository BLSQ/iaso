import {
    getApiTeamsDropdownListQueryKey,
    getApiTeamsListQueryKey,
    getApiTeamsTreeListQueryKey,
} from 'Iaso/api/teams/endpoints/teams/teams';
import { Value8edEnum } from 'Iaso/api/teams/models/value8edEnum.zod';

export { Value8edEnum as TeamType };

export const TEAM_QUERY_KEYS = [
    getApiTeamsDropdownListQueryKey()[0],
    getApiTeamsListQueryKey()[0],
    getApiTeamsTreeListQueryKey()[0],
];
