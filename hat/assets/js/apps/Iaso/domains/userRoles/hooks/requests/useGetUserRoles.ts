/* eslint-disable camelcase */
import { UseQueryResult } from 'react-query';
import { Pagination } from 'bluesquare-components';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import {
    UserRoleParams,
    UserRolesFilterParams,
    UserRole,
} from '../../types/userRoles';

type UserRolesList = Pagination & {
    results: UserRole[];
};

const getUserRoles = async (
    options: UserRoleParams | UserRolesFilterParams,
): Promise<UserRolesList> => {
    const { pageSize, order, page, ...params } = options as Record<string, any>;

    params.limit = pageSize || 20;
    params.order = order || 'group__name';
    params.page = page || 1;
    if (params.select) {
        delete params.select;
    }
    const url = makeUrlWithParams('/api/userroles', params);
    return getRequest(url) as Promise<UserRolesList>;
};

export const useGetUserRoles = (
    options: UserRoleParams | UserRolesFilterParams,
): UseQueryResult<UserRolesList, Error> => {
    const { select } = options as Record<string, any>;
    return useSnackQuery({
        queryKey: ['userRolesList', options],
        queryFn: () => getUserRoles(options),
        snackErrorMsg: undefined,
        options: {
            select,
        },
    });
};
