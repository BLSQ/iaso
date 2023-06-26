import { useSafeIntl } from 'bluesquare-components';
import React, { useCallback, useMemo } from 'react';
import {
    CheckCircleOutlineOutlined as CheckedIcon,
    HighlightOffOutlined as NotCheckedIcon,
} from '@material-ui/icons';
import { Switch } from '@material-ui/core';
import MESSAGES from '../messages';

type Row = {
    permission: string;
    userPermission: any;
};

type Permission = {
    id: number;
    codename: string;
};

type UserRole = {
    id: number;
    name: string;
    permissions: string[];
};

export const useGetUserPermissions = (
    allPermissions: Permission[],
    userPermissions: string[],
    rolePermissions: UserRole[],
    // eslint-disable-next-line no-unused-vars
    setPermissions: (codename: string, targetValue: boolean) => void,
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
            row.userPermission = (
                <Switch
                    className="permission-checkbox"
                    id={`permission-checkbox-${p.codename}`}
                    checked={Boolean(
                        userPermissions.find(up => up === p.codename),
                    )}
                    onChange={e => setPermissions(p.codename, e.target.checked)}
                    name={p.codename}
                    color="primary"
                />
            );
            rolePermissions.forEach(role => {
                if (
                    role.permissions.find(
                        permission => permission === p.codename,
                    )
                ) {
                    row[role.id.toString()] = (
                        <CheckedIcon style={{ color: 'green' }} />
                    );
                } else {
                    row[role.id.toString()] = (
                        <NotCheckedIcon color="disabled" />
                    );
                }
            });
            data.push(row);
        });
        return data;
    }, [
        permissionLabel,
        rolePermissions,
        setPermissions,
        sortedPermissions,
        userPermissions,
    ]);
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
