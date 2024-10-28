import { Pagination } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../../libs/Api';
import { useSnackQuery } from '../../../../libs/apiHooks';
import { makeUrlWithParams } from '../../../../libs/utils';
import { DropdownOptions } from '../../../../types/utils';
import MESSAGES from '../../messages';
import {
    UserRole,
    UserRoleParams,
    UserRolesFilterParams,
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
    const url = makeUrlWithParams('/api/userroles/', params);
    return getRequest(url) as Promise<UserRolesList>;
};

export const useGetUserRoles = (
    options: UserRoleParams | UserRolesFilterParams,
): UseQueryResult<UserRolesList, Error> => {
    const { select } = options as Record<string, any>;
    const safeParams = {
        ...options,
    };
    if (safeParams?.accountId) {
        delete safeParams.accountId;
    }
    return useSnackQuery({
        queryKey: ['userRoles', options],
        queryFn: () => getUserRoles(safeParams),
        snackErrorMsg: undefined,
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            keepPreviousData: true,
            select,
        },
    });
};

export const useGetUserRolesDropDown = (): UseQueryResult<
    DropdownOptions<number>[],
    Error
> => {
    return useSnackQuery({
        queryKey: ['userRoles'],
        queryFn: () => getRequest('/api/userroles/'),
        snackErrorMsg: MESSAGES.userRolesDropDownError,
        options: {
            staleTime: 1000 * 60 * 15, // in MS
            cacheTime: 1000 * 60 * 5,
            select: data => {
                return (
                    data?.results?.map((userRole: UserRole) => {
                        return {
                            value: userRole.id,
                            label: userRole.name,
                            original: userRole,
                        };
                    }) ?? []
                );
            },
        },
    });
};
