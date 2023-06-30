import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import { DropdownOptions } from '../../../types/utils';
import { UserRole } from '../../userRoles/types/userRoles';
import MESSAGES from '../messages';

export const useGetUserRolesDropDown = (): UseQueryResult<
    DropdownOptions<number>,
    Error
> => {
    return useSnackQuery({
        queryKey: ['user_roles'],
        queryFn: () => getRequest('/api/userroles'),
        snackErrorMsg: MESSAGES.userRolesDropDownError,
        options: {
            select: data => {
                return (
                    data?.results?.map((userRole: UserRole) => {
                        return {
                            value: userRole.id,
                            label: userRole.name,
                        };
                    }) ?? []
                );
            },
        },
    });
};
