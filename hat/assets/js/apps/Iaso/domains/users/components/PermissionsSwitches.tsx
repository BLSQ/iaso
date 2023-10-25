import React, { useCallback } from 'react';
import { Box, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    useSafeIntl,
    LoadingSpinner,
    Table,
    Column,
} from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import MESSAGES from '../messages';
import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';
import { useUserPermissionColumns } from '../config';
import { useGetUserPermissions } from '../hooks/useGetUserPermissions';
import { Permission } from '../../userRoles/types/userRoles';
import { useGetUserRolesDropDown } from '../hooks/useGetUserRolesDropDown';
import { userHasPermission } from '../utils';
import * as Permissions from '../../../utils/permissions';
import { useCurrentUser } from '../../../utils/usersUtils';

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
    isSuperUser?: boolean;
    currentUser: any;
    // eslint-disable-next-line no-unused-vars
    handleChange: (newValue: any) => void;
    // eslint-disable-next-line no-unused-vars
    setFieldValue: (fieldName, fieldError) => void;
};

type PermissionResult = {
    permissions: Permission[];
};

const PermissionsSwitches: React.FunctionComponent<Props> = ({
    isSuperUser,
    currentUser,
    handleChange,
    setFieldValue,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { data, isLoading } = useSnackQuery<PermissionResult>({
        queryKey: ['permissions'],
        queryFn: () => getRequest('/api/permissions/'),
        snackErrorMsg: MESSAGES.fetchPermissionsError,
        // Permission list is not displayed for superuser, no need to fetch it from server
        options: { enabled: !isSuperUser },
    });

    const setPermissions = (codeName: string, isChecked: boolean) => {
        const newUserPerms = [...currentUser.user_permissions.value];
        if (!isChecked) {
            const permIndex = newUserPerms.indexOf(codeName);
            newUserPerms.splice(permIndex, 1);
        } else {
            newUserPerms.push(codeName);
        }
        handleChange(newUserPerms);
    };
    const loggedInUser = useCurrentUser();
    const allPermissions =
        data?.permissions?.filter(permission =>
            canAssignPermission(loggedInUser, permission),
        ) ?? [];
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

PermissionsSwitches.defaultProps = {
    isSuperUser: false,
};

export default PermissionsSwitches;
