import { isEmpty } from 'lodash';
import { UseMutationResult } from 'react-query';
import { postRequest, putRequest } from '../../../../libs/Api';
import { useSnackMutation } from '../../../../libs/apiHooks';
import { Permission } from '../../types/userRoles';

export type SaveUserRoleQuery = {
    id?: number;
    name: string;
    permissions?: Array<Permission>;
    editable_org_unit_type_ids?: number[];
};

const convertToApi = (data: Partial<SaveUserRoleQuery>) => {
    const { permissions, ...converted } = data;
    return {
        ...converted,
        permissions: !isEmpty(permissions) ? permissions : undefined,
        editable_org_unit_types: converted.editable_org_unit_type_ids,
    };
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
        invalidateQueryKey: ['userRoles'],
        ignoreErrorCodes,
    });
    const createUserRole = useSnackMutation({
        mutationFn: (data: SaveUserRoleQuery) => postUserRole(data),
        invalidateQueryKey: ['userRoles'],
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
