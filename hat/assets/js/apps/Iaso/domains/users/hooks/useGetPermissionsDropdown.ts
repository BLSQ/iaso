import { UseQueryResult } from 'react-query';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import MESSAGES from '../messages';

export const useGetPermissionsDropDown = (): UseQueryResult =>
    useSnackQuery({
        queryKey: ['permissions'],
        queryFn: () => getRequest('/api/permissions/'),
        snackErrorMsg: MESSAGES.fetchPermissionsError,
        options: {
            select: data => {
                if (!data) return [];
                return data.permissions.map(permission => {
                    return {
                        value: permission.codename,
                        label: permission.name,
                    };
                });
            },
        },
    });
