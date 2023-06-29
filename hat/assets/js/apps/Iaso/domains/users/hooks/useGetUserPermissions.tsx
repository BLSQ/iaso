import { useSafeIntl } from 'bluesquare-components';
import { useCallback, useMemo } from 'react';

import MESSAGES from '../messages';

type Row = {
    permission: string;
    userPermission: any;
};

type Permission = {
    id: number;
    codename: string;
};

export const useGetUserPermissions = (
    allPermissions: Permission[],
    userPermissions: string[],
): any => {
    const { formatMessage } = useSafeIntl();
    const permissionLabel = useCallback(
        permissionCodeName => {
            return MESSAGES[permissionCodeName]
                ? formatMessage(MESSAGES[permissionCodeName])
                : permissionCodeName;
        },
        [formatMessage],
    );
    const sortedPermissions = useGetSortedPermissions({
        allPermissions,
        permissionLabel,
    });
    return useMemo(() => {
        const data: Row[] = [];

        sortedPermissions.forEach(p => {
            const row: any = {};
            row.permission = permissionLabel(p.codename);
            row.userPermissions = userPermissions;
            row.permissionCodeName = p.codename;

            data.push(row);
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
}: SortProps): Permission[] => {
    return useMemo(() => {
        let sortedPermissions: Permission[] = [];
        sortedPermissions = allPermissions.sort((a, b) =>
            permissionLabel(a.codename).localeCompare(
                permissionLabel(b.codename),
                undefined,
                {
                    sensitivity: 'accent',
                },
            ),
        );
        return sortedPermissions;
    }, [allPermissions, permissionLabel]);
};
