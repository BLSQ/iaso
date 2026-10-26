import { useSafeIntl } from 'bluesquare-components';
import { get } from 'lodash';
import { UseQueryResult } from 'react-query';
import { getRequest } from 'Iaso/libs/Api';
import { useSnackQuery } from 'Iaso/libs/apiHooks';
import MESSAGES from '../messages';
import { usePermissionsMessages } from '../permissionsMessages';

type UseGetPermissionsDropDownParams = {
    outputValueField?: 'codename' | 'id';
};

export const useGetPermissionsDropDown = ({
    outputValueField = 'codename',
}: UseGetPermissionsDropDownParams = {}): UseQueryResult => {
    const { formatMessage } = useSafeIntl();
    const permissionsMessages = usePermissionsMessages();
    return useSnackQuery({
        queryKey: ['permissions'],
        queryFn: () => getRequest('/api/permissions/'),
        snackErrorMsg: MESSAGES.fetchPermissionsError,
        options: {
            select: data => {
                if (!data) return [];
                return data.permissions.map(
                    (permission: { codename: string }) => {
                        return {
                            value: get(permission, outputValueField),
                            label: permissionsMessages[permission.codename]
                                ? formatMessage(
                                      permissionsMessages[permission.codename],
                                  )
                                : permission.codename,
                        };
                    },
                );
            },
        },
    });
};
