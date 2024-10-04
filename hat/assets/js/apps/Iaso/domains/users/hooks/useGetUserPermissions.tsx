import { useSafeIntl } from 'bluesquare-components';
import { useCallback, useMemo } from 'react';
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
    const getPermissionLabel = useCallback(
        permissionCodeName => {
            return PERMISSIONS_MESSAGES[permissionCodeName]
                ? formatMessage(PERMISSIONS_MESSAGES[permissionCodeName])
                : permissionCodeName;
        },
        [formatMessage],
    );

    const sortedPermissions = useGetSortedPermissions({
        allPermissions,
        getPermissionLabel,
    });

    return useMemo(() => {
        const data: Row[] = [];

        Object.keys(sortedPermissions).forEach(group => {
            let row: any = {};
            row.permission = group;
            row.group = true;
            data.push(row);
            sortedPermissions[group].forEach(p => {
                row = {};
                row.permission = getPermissionLabel(p.codename);
                row.userPermissions = userPermissions;
                row.permissionCodeName = p.codename;
                if (p.read_edit) {
                    row.readEdit = p.read_edit;
                }

                data.push(row);
            });
        });
        return data;
    }, [getPermissionLabel, sortedPermissions, userPermissions]);
};

type SortProps = {
    allPermissions: string[];
    getPermissionLabel: (codename: string) => string;
};

const useGetSortedPermissions = ({
    allPermissions,
    getPermissionLabel,
}: SortProps): any => {
    return useMemo(() => {
        const sortedPermissions = {};
        Object.keys(allPermissions).forEach(group => {
            sortedPermissions[group] = allPermissions[group].sort((a, b) =>
                getPermissionLabel(a.codename).localeCompare(
                    getPermissionLabel(b.codename),
                    undefined,
                    {
                        sensitivity: 'accent',
                    },
                ),
            );
        });
        return sortedPermissions;
    }, [allPermissions, getPermissionLabel]);
};
