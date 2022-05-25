import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

export type SaveTeamQuery = {
    id?: number;
    name: string;
    description?: string;
};

const endpoint = '/api/microplanning/teams/';

const patchTeam = async (body: Partial<SaveTeamQuery>) => {
    const url = `${endpoint}${body.id}/`;
    return patchRequest(url, body);
};

const postTeam = async (body: SaveTeamQuery) => {
    return postRequest(endpoint, body);
};

export const useSaveTeam = (type: 'create' | 'edit'): UseMutationResult => {
    const editTeam = useSnackMutation(
        (data: Partial<SaveTeamQuery>) => patchTeam(data),
        undefined,
        undefined,
        ['teamssList'],
    );
    const createTeam = useSnackMutation(
        (data: SaveTeamQuery) => postTeam(data),
        undefined,
        undefined,
        ['teamssList'],
    );

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
