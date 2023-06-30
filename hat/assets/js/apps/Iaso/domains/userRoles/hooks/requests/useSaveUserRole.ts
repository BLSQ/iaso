/* eslint-disable camelcase */
import { UseMutationResult } from 'react-query';
import { isEmpty } from 'lodash';
import { putRequest, postRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { Permission } from '../../types/userRoles';

export type SaveUserRoleQuery = {
    id?: number;
    name: string;
    permissions?: Array<Permission>;
};

const convertToApi = data => {
    const { permissions, ...converted } = data;
    if (!isEmpty(permissions)) {
        converted.permissions = permissions.map(
            permission => permission.codename,
        );
    }
    return converted;
};

const endpoint = '/api/userroles/';

const putUserRole = async (body: Partial<SaveUserRoleQuery>) => {
    const url = `${endpoint}${body.id}/`;
    return putRequest(url, convertToApi(body));
};

const postUserRole = async (body: SaveUserRoleQuery) => {
    return postRequest(endpoint, convertToApi(body));
};

export const useSaveUserRole = (type: 'create' | 'edit'): UseMutationResult => {
    const ignoreErrorCodes = [400];
    const editUserRole = useSnackMutation({
        mutationFn: (data: Partial<SaveUserRoleQuery>) => putUserRole(data),
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
