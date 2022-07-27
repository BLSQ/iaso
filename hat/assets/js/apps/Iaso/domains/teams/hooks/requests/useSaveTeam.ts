/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

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
};

const convertToApi = data => {
    const { subTeams, ...converted } = data;
    if (subTeams !== undefined) {
        converted.sub_teams = subTeams;
    }
    return converted;
};

export const convertAPIErrorsToState = data => {
    const { sub_teams, ...converted } = data;
    if (sub_teams !== undefined) {
        converted.subTeams = sub_teams;
    }
    return converted;
};

const endpoint = '/api/microplanning/teams/';

const patchTeam = async (body: Partial<SaveTeamQuery>) => {
    const url = `${endpoint}${body.id}/`;
    return patchRequest(url, convertToApi(body));
};

const postTeam = async (body: SaveTeamQuery) => {
    return postRequest(endpoint, convertToApi(body));
};

export const useSaveTeam = (type: 'create' | 'edit'): UseMutationResult => {
    const ignoreErrorCodes = [400];
    const editTeam = useSnackMutation({
        mutationFn: (data: Partial<SaveTeamQuery>) => patchTeam(data),
        invalidateQueryKey: ['teamsList'],
        ignoreErrorCodes,
    });
    const createTeam = useSnackMutation({
        mutationFn: (data: SaveTeamQuery) => postTeam(data),
        invalidateQueryKey: ['teamsList'],
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
