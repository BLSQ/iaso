/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { Pagination } from '../../../../types/table';
import {
    UserRoleParams,
    UserRolesFilterParams,
    UserRole,
} from '../../types/userRoles';

type UserRolesList = Pagination & {
    user_roles: UserRole[];
};

const getUserRoles = async (
    options: UserRoleParams | UserRolesFilterParams,
): Promise<UserRolesList> => {
    const { pageSize, ...params } = options as Record<string, any>;
    if (pageSize) {
        params.limit = pageSize;
    }
    if (params.select) {
        delete params.select;
    }
    console.log(params);
    const url = makeUrlWithParams('/api/userroles', params);
    return getRequest(url) as Promise<UserRolesList>;
};

export const useGetUserRoles = (
    options: UserRoleParams | UserRolesFilterParams,
): UseQueryResult<UserRolesList, Error> => {
    const queryKey: any[] = ['userRolesList', options];
    const { select } = options as Record<string, any>;
    // @ts-ignore
    return useSnackQuery(queryKey, () => getUserRoles(options), undefined, {
        select,
    });
};
