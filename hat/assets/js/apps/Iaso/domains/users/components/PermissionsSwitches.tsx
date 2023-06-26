import React, { useMemo } from 'react';
import { Switch, Typography, makeStyles } from '@material-ui/core';
// @ts-ignore
import { useSafeIntl, LoadingSpinner, Table } from 'bluesquare-components';
import {
    CheckCircleOutlineOutlined as CheckedIcon,
    HighlightOffOutlined as NotCheckedIcon,
} from '@material-ui/icons';
import MESSAGES from '../messages';
import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';
import { userPermissionColumns } from '../config';

const styles = theme => ({
    admin: {
        color: theme.palette.success.main,
    },
    tableCellStyle: {
        border: '1px solid grey',
    },
});

const useStyles = makeStyles(styles);
type Permission = {
    id: number;
    codename: string;
};
type Props = {
    isSuperUser?: boolean;
    currentUser: any;
    // eslint-disable-next-line no-unused-vars
    handleChange: (newValue: any) => void;
};

type PermissionResult = {
    permissions: Permission[];
};

type Row = {
    permission: string;
    userPermission: any;
};

const useGetPermissionData = (
    allPermissions,
    userPermissions,
    rolePermissions,
    setPermissions,
) => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const data: Array<Row> = [];
        const permissionLabel = permissionCodeName => {
            return MESSAGES[permissionCodeName]
                ? formatMessage(MESSAGES[permissionCodeName])
                : permissionCodeName;
        };

        allPermissions
            .sort((a, b) =>
                permissionLabel(a.codename).localeCompare(
                    permissionLabel(b.codename),
                    undefined,
                    {
                        sensitivity: 'accent',
                    },
                ),
            )
            .forEach(p => {
                const row: any = {};
                row.permission = permissionLabel(p.codename);
                row.userPermission = (
                    <Switch
                        className="permission-checkbox"
                        id={`permission-checkbox-${p.codename}`}
                        checked={Boolean(
                            userPermissions.find(up => up === p.codename),
                        )}
                        onChange={e =>
                            setPermissions(p.codename, e.target.checked)
                        }
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
        allPermissions,
        formatMessage,
        rolePermissions,
        setPermissions,
        userPermissions,
    ]);
};

const PermissionsSwitches: React.FunctionComponent<Props> = ({
    isSuperUser,
    currentUser,
    handleChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { data, isLoading } = useSnackQuery<PermissionResult>(
        ['permissions'],
        () => getRequest('/api/permissions/'),
        MESSAGES.fetchPermissionsError,
        // Permission list is not displayed for superuser, no need to fetch it from server
        { enabled: !isSuperUser },
    );

    const setPermissions = (codeName: string, isChecked: boolean) => {
        const newUserPerms = [...currentUser.permissions.value];
        if (!isChecked) {
            const permIndex = newUserPerms.indexOf(codeName);
            newUserPerms.splice(permIndex, 1);
        } else {
            newUserPerms.push(codeName);
        }
        handleChange(newUserPerms);
    };

    const allPermissions = data?.permissions ?? [];
    const userPermissions = currentUser.permissions.value;
    const userRoles = currentUser.user_roles_permissions.value;
    const permissionsData = useGetPermissionData(
        allPermissions,
        userPermissions,
        userRoles,
        setPermissions,
    );

    return (
        <>
            {isLoading && <LoadingSpinner />}
            {isSuperUser && (
                <Typography
                    id="superuser-permission-message"
                    variant="body1"
                    className={classes.admin}
                >
                    {formatMessage(MESSAGES.isSuperUser)}
                </Typography>
            )}

            {!isSuperUser && (
                <Table
                    columns={userPermissionColumns({
                        formatMessage,
                        currentUser,
                    })}
                    data={permissionsData}
                    showPagination={false}
                />
            )}
        </>
    );
};

PermissionsSwitches.defaultProps = {
    isSuperUser: false,
};

export default PermissionsSwitches;
