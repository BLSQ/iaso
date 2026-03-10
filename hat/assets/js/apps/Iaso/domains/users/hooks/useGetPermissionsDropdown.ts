import { useSafeIntl } from 'bluesquare-components';
import { get } from 'lodash';
import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import MESSAGES from '../messages';
import PERMISSIONS_MESSAGES from '../permissionsMessages';

type UseGetPermissionsDropDownParams = {
    outputValueField?: 'codename' | 'id';
};

export const useGetPermissionsDropDown = ({
    outputValueField = 'codename',
}: UseGetPermissionsDropDownParams = {}): UseQueryResult => {
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
                        value: get(permission, outputValueField),
                        label: PERMISSIONS_MESSAGES[permission.codename]
                            ? formatMessage(
                                  PERMISSIONS_MESSAGES[permission.codename],
                              )
                            : permission.codename,
                    };
                });
            },
        },
    });
};
