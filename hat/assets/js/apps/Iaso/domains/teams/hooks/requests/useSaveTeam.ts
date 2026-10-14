import { useQueryClient } from 'react-query';
import { patchRequest, postRequest } from 'Iaso/libs/Api';
import { useSnackMutation } from 'Iaso/libs/apiHooks';
import { Team } from '../../types/team';

type TeamType = 'TEAM_OF_TEAMS' | 'TEAM_OF_USERS';

export type SaveTeamQuery = {
    id?: number;
    name: string;
    description?: string;
    manager: number;
    subTeams: Array<number>;
    project: number;
    type?: TeamType;
    users: Array<number>;
    parent?: number;
    color?: string;
};

type SaveTeamQueryAPIConverted = Partial<SaveTeamQuery> & {
    sub_teams?: SaveTeamQuery['subTeams'];
};

const convertToApi = (
    data: Partial<SaveTeamQuery>,
): SaveTeamQueryAPIConverted => {
    const { subTeams, ...converted } = data;
    return {
        ...converted,
        ...(subTeams !== undefined ? { sub_teams: subTeams } : {}),
    };
};

export const convertAPIErrorsToState = (data: Record<string, string>) => {
    const { sub_teams, ...converted } = data;
    return {
        ...converted,
        ...(sub_teams !== undefined ? { subTeams: sub_teams } : {}),
    };
};

const ENDPOINT = '/api/teams/';

const patchTeam = async (body: Partial<SaveTeamQuery>) => {
    const url = `${ENDPOINT}${body.id}/`;
    return patchRequest(url, convertToApi(body));
};

const postTeam = async (body: SaveTeamQuery) => {
    return postRequest(ENDPOINT, convertToApi(body));
};

export const useSaveTeam = (
    type: 'create' | 'edit',
    showSuccessSnackBar = true,
) => {
    const ignoreErrorCodes = [400];
    const queryClient = useQueryClient();
    const editTeam = useSnackMutation({
        mutationFn: (data: Partial<SaveTeamQuery>) => patchTeam(data),
        invalidateQueryKey: ['teamsList', 'teamsDropdown', 'team'],
        ignoreErrorCodes,
        showSuccessSnackBar,
        options: {
            onSuccess: (data: Team) => {
                queryClient.invalidateQueries(['team', `team-${data.id}`]);
            },
        },
    });
    const createTeam = useSnackMutation({
        mutationFn: (data: SaveTeamQuery) => postTeam(data),
        invalidateQueryKey: ['teamsList', 'teamsDropdown'],
        ignoreErrorCodes,
    });

    switch (type) {
        case 'create':
            return createTeam;
        case 'edit':
            return editTeam;
        default:
            throw new Error(
                `wrong type expected: create, copy or edit, got:  ${type} `,
            );
    }
};
