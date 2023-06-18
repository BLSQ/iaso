/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { patchRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';

type Permission = {
    id: number;
    name: string;
    codename: string;
};

export type SaveUserRoleQuery = {
    id?: number;
    name: string;
    permissions?: Array<Permission>;
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

const endpoint = '/api/userroles/';

const patchUserRole = async (body: Partial<SaveUserRoleQuery>) => {
    const url = `${endpoint}${body.id}/`;
    return patchRequest(url, convertToApi(body));
};

const postUserRole = async (body: SaveUserRoleQuery) => {
    return postRequest(endpoint, convertToApi(body));
};

export const useSaveUserRole = (type: 'create' | 'edit'): UseMutationResult => {
    const ignoreErrorCodes = [400];
    const editUserRole = useSnackMutation({
        mutationFn: (data: Partial<SaveUserRoleQuery>) => patchUserRole(data),
        invalidateQueryKey: ['userRolesList'],
        ignoreErrorCodes,
    });
    const createUserRole = useSnackMutation({
        mutationFn: (data: SaveUserRoleQuery) => postUserRole(data),
        invalidateQueryKey: ['userRolesList'],
        ignoreErrorCodes,
    });

    switch (type) {
        case 'create':
            return createUserRole;
        case 'edit':
            return editUserRole;
        default:
            throw new Error(
                `wrong type expected: create, copy or edit, got:  ${type} `,
            );
    }
};
