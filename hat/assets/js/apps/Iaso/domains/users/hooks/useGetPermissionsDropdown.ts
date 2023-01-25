import { UseQueryResult } from 'react-query';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import MESSAGES from '../messages';

export const useGetPermissionsDropDown = (): UseQueryResult => {
    const { formatMessage } = useSafeIntl();
    return useSnackQuery({
        queryKey: ['permissions'],
        queryFn: () => getRequest('/api/permissions/'),
        snackErrorMsg: MESSAGES.fetchPermissionsError,
        options: {
            select: data => {
                if (!data) return [];
                return data.permissions.map(permission => {
                    return {
                        value: permission.codename,
                        label: MESSAGES[permission.codename]
                            ? formatMessage(MESSAGES[permission.codename])
                            : permission.codename,
                    };
                });
            },
        },
    });
};
