import React, { useCallback, useMemo } from 'react';
import { Box } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl, LoadingSpinner, Table } from 'bluesquare-components';
import MESSAGES from '../messages';
import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';
import { Permission } from '../types/userRoles';
import PERMISSIONS_MESSAGES from '../../users/permissionsMessages';
import { useUserPermissionColumns } from '../config';
import PERMISSIONS_GROUPS_MESSAGES from '../../users/permissionsGroupsMessages';

const styles = theme => ({
    container: {
        '& .MuiTableHead-root': {
            position: 'sticky',
            top: 0,
            zIndex: 10,
        },
        '& .MuiTableContainer-root': {
            maxHeight: '58vh',
            overflow: 'auto',
            border: `1px solid ${theme.palette.border.main}`,
        },
        marginTop: theme.spacing(2),
        maxHeight: '60vh',
        overflow: 'scroll',
    },
});

const useStyles = makeStyles(styles);

type Props = {
    userRolePermissions: Permission[];
    // eslint-disable-next-line no-unused-vars
    handleChange: (newValue: any) => void;
};

type Row = {
    name?: string;
    codename?: string;
    group?: boolean;
    id?: number;
    readEdit?: { read: string; edit: string }[];
};

export const PermissionsSwitches: React.FunctionComponent<Props> = ({
    userRolePermissions,
    handleChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { data, isLoading } = useSnackQuery<{ permissions: Permission[] }>(
        ['grouped_permissions'],
        () => getRequest('/api/permissions/grouped_permissions/'),
        MESSAGES.fetchPermissionsError,
    );

    const setPermissions = useCallback(
        (permission: Permission, isChecked: boolean) => {
            const newUserRolePerms = [...userRolePermissions];
            if (!isChecked) {
                const permIndex = newUserRolePerms.findIndex(item => {
                    return item.codename === permission.codename;
                });
                newUserRolePerms.splice(permIndex, 1);
            } else {
                newUserRolePerms.push({
                    id: permission.id,
                    codename: permission.codename,
                    name: permission.name,
                });
            }
            handleChange(newUserRolePerms);
        },
        [handleChange, userRolePermissions],
    );

    const groupPermissionLabel = useCallback(
        groupName => {
            return PERMISSIONS_GROUPS_MESSAGES[groupName]
                ? formatMessage(PERMISSIONS_GROUPS_MESSAGES[groupName])
                : groupName;
        },
        [formatMessage],
    );

    const permissions_groups = useMemo(
        () => data?.permissions ?? [],
        [data?.permissions],
    );

    const getPermissionLabel = useCallback(
        permissionCodeName => {
            return PERMISSIONS_MESSAGES[permissionCodeName]
                ? formatMessage(PERMISSIONS_MESSAGES[permissionCodeName])
                : permissionCodeName;
        },
        [formatMessage],
    );

    const permissions: Row[] = useMemo(() => {
        const grouped_permissions: Row[] = [];
        Object.keys(permissions_groups).forEach(group => {
            let row: Row = {};
            row.codename = groupPermissionLabel(group);
            row.group = true;
            grouped_permissions.push(row);
            permissions_groups[group].forEach(permission => {
                row = {};
                row.id = permission.id;
                row.codename = permission.codename;
                row.name = getPermissionLabel(permission.codename);
                if (permission.read_edit) {
                    row.readEdit = permission.read_edit;
                }
                grouped_permissions.push(row);
            });
        });
        return grouped_permissions;
    }, [getPermissionLabel, groupPermissionLabel, permissions_groups]);

    const columns = useUserPermissionColumns(
        setPermissions,
        userRolePermissions,
    );

    return (
        <Box className={classes.container}>
            {isLoading && <LoadingSpinner />}
            <Table
                columns={columns}
                data={permissions}
                showPagination={false}
                countOnTop={false}
                marginTop={false}
                marginBottom={false}
                extraProps={{
                    columns,
                }}
                elevation={0}
            />
        </Box>
    );
};
