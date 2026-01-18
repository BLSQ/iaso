import React, { useCallback, useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    Column,
    LoadingSpinner,
    Table,
    useSafeIntl,
} from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import { getRequest } from '../../../libs/Api';
import { useSnackQuery } from '../../../libs/apiHooks';
import * as Permissions from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';
import { useGetUserRolesDropDown } from '../../userRoles/hooks/requests/useGetUserRoles';
import { useUserPermissionColumns } from '../config';
import { useGetUserPermissions } from '../hooks/useGetUserPermissions';
import MESSAGES from '../messages';
import { userHasPermission } from '../utils';

const canAssignPermission = (user, permission): boolean => {
    if (userHasPermission(Permissions.USERS_ADMIN, user)) {
        return true;
    }
    return permission.codename !== Permissions.USERS_ADMIN;
};

const styles = theme => ({
    admin: {
        color: theme.palette.success.main,
    },
    tableCellStyle: {
        border: '1px solid grey',
    },
    tableStyle: {
        '& .MuiTableHead-root': {
            position: 'sticky',
            top: 0,
            zIndex: 10,
        },
        '& .MuiTableContainer-root': {
            maxHeight: '59vh',
            overflow: 'auto',
            border: `1px solid ${theme.palette.border.main}`,
        },
    },
});

const useStyles = makeStyles(styles);

type Props = {
    isSuperUser: boolean;
    currentUser: any;
    handleChange: (newValue: any) => void;
    setFieldValue: (fieldName, fieldError) => void;
};

type PermissionResult = {
    permissions: string[];
};

const PermissionsAttribution: React.FunctionComponent<Props> = ({
    isSuperUser = false,
    currentUser,
    handleChange,
    setFieldValue,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { data, isLoading } = useSnackQuery<PermissionResult>({
        queryKey: ['grouped_permissions'],
        queryFn: () => getRequest('/api/permissions/grouped_permissions/'),
        snackErrorMsg: MESSAGES.fetchPermissionsError,
        // Permission list is not displayed for superuser, no need to fetch it from server
        options: { enabled: !isSuperUser },
    });
    const setPermissions = useCallback(
        (codeName: string | string[], isChecked: boolean) => {
            const newUserPerms = [...currentUser.user_permissions.value];
            if (!isChecked) {
                const permIndex = newUserPerms.indexOf(codeName);
                newUserPerms.splice(permIndex, 1);
            } else if (Array.isArray(codeName)) {
                codeName.forEach(code => {
                    newUserPerms.push(code);
                });
            } else {
                newUserPerms.push(codeName);
            }
            handleChange(newUserPerms);
        },
        [currentUser.user_permissions.value, handleChange],
    );
    const loggedInUser = useCurrentUser();

    const allPermissions = useMemo(() => {
        const groups = data?.permissions ? Object.keys(data?.permissions) : [];
        const permissions = {};
        groups.forEach(group => {
            permissions[group] =
                data?.permissions[group]?.filter(permission =>
                    canAssignPermission(loggedInUser, permission),
                ) ?? [];
        });
        return permissions;
    }, [data?.permissions, loggedInUser]);

    const userPermissions = currentUser.user_permissions.value;
    const { data: userRoles, isFetching } = useGetUserRolesDropDown();
    const permissionsData = useGetUserPermissions(
        allPermissions,
        userPermissions,
    );

    // This is a problem with the type definition of Column is bluesquare-components
    // @ts-ignore
    const columns: Column[] = useUserPermissionColumns({
        setPermissions,
        currentUser,
    });

    const handleChangeUserRoles = useCallback(
        (_, value) => {
            const newUserRoles = value
                ? value.split(',').map(userRoleId => parseInt(userRoleId, 10))
                : [];

            setFieldValue('user_roles', newUserRoles);
        },
        [setFieldValue],
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
                <>
                    <Box mb={2} width="50%">
                        <InputComponent
                            keyValue="user_roles"
                            onChange={handleChangeUserRoles}
                            value={currentUser.user_roles.value}
                            type="select"
                            multi
                            label={MESSAGES.userRoles}
                            options={userRoles}
                            loading={isFetching}
                            clearable
                        />
                    </Box>
                    <Box className={classes.tableStyle}>
                        <Table
                            columns={columns}
                            data={permissionsData}
                            showPagination={false}
                            countOnTop={false}
                            marginTop={false}
                            marginBottom={false}
                            extraProps={{
                                currentUser,
                                columns,
                            }}
                            elevation={0}
                        />
                    </Box>
                </>
            )}
        </>
    );
};

export default PermissionsAttribution;
