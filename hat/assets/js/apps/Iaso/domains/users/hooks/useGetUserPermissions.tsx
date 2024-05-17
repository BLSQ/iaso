import { useSafeIntl } from 'bluesquare-components';
import { useCallback, useMemo } from 'react';
import { Permission } from '../../userRoles/types/userRoles';
import PERMISSIONS_MESSAGES from '../permissionsMessages';

type Row = {
    permission: string;
    userPermission: any;
};

export const useGetUserPermissions = (
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    allPermissions: any,
    userPermissions: string[],
): any => {
    const { formatMessage } = useSafeIntl();
    const permissionLabel = useCallback(
        permissionCodeName => {
            return PERMISSIONS_MESSAGES[permissionCodeName]
                ? formatMessage(PERMISSIONS_MESSAGES[permissionCodeName])
                : permissionCodeName;
        },
        [formatMessage],
    );

    const sortedPermissions = useGetSortedPermissions({
        allPermissions,
        permissionLabel,
    });

    return useMemo(() => {
        const data: any = {};

        Object.keys(sortedPermissions).forEach(group => {
            data[group] = [];
            sortedPermissions[group].forEach(p => {
                const row: any = {};
                row.permission = permissionLabel(p.codename);
                row.userPermissions = userPermissions;
                row.permissionCodeName = p.codename;

                data[group].push(row);
            });
        });
        return data;
    }, [permissionLabel, sortedPermissions, userPermissions]);
};

type SortProps = {
    allPermissions: Permission[];
    // eslint-disable-next-line no-unused-vars
    permissionLabel: (codename: string) => string;
};

const useGetSortedPermissions = ({
    allPermissions,
    permissionLabel,
}: SortProps): any => {
    return useMemo(() => {
        const sortedPermissions = {};
        Object.keys(allPermissions).forEach(group => {
            sortedPermissions[group] = allPermissions[group].sort((a, b) =>
                permissionLabel(a.codename).localeCompare(
                    permissionLabel(b.codename),
                    undefined,
                    {
                        sensitivity: 'accent',
                    },
                ),
            );
        });
        return sortedPermissions;
    }, [allPermissions, permissionLabel]);
};
