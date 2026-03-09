import React, { useCallback, useMemo } from 'react';
import { Box, SxProps, Typography, Theme } from '@mui/material';
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

const styles: Record<string, SxProps<Theme>> = {
    admin: theme => ({
        color: theme.palette.success.main,
    }),
    tableStyle: theme => ({
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
    }),
};

type Props = {
    isSuperUser: boolean;
    currentUser: any;
    handleChange: (newValue: any) => void;
    setFieldValue: (fieldName, fieldError) => void;
};

type PermissionResult = {
    permissions: string[];
};

type UserPermission = {
    id: number;
    name: string;
};

const parseUserPermissions = (
    userPermissions?: (UserPermission | number)[],
): string[] => {
    // we do this because the response from the list api differs from the retrieve
    // list returns [{id: .., name:..}] where retrieve returns a list of ids.
    // as this is used in modal of list and view UI , it's kind of messy.
    // once we fix the mismatches between list and view, we can refactor this
    return (
        userPermissions?.map((v: UserPermission | number) =>
            typeof v === 'object' && 'id' in v
                ? v.id?.toString()
                : v?.toString(),
        ) ?? []
    );
};

const PermissionsAttribution: React.FunctionComponent<Props> = ({
    isSuperUser = false,
    currentUser,
    handleChange,
    setFieldValue,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data, isLoading } = useSnackQuery<PermissionResult>({
        queryKey: ['grouped_permissions'],
        queryFn: () => getRequest('/api/permissions/grouped_permissions/'),
        snackErrorMsg: MESSAGES.fetchPermissionsError,
        // Permission list is not displayed for superuser, no need to fetch it from server
        options: { enabled: !isSuperUser },
    });

    const setPermissions = useCallback(
        (codeName: string | string[], isChecked: boolean) => {
            const newUserPerms = [
                ...parseUserPermissions(currentUser.userPermissions.value),
            ];
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
        [currentUser.userPermissions.value, handleChange],
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

    const userPermissions = parseUserPermissions(
        currentUser.userPermissions.value,
    );
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
                ? value
                      .split(',')
                      .map((userRoleId: any) => parseInt(userRoleId, 10))
                : [];

            setFieldValue('userRoles', newUserRoles);
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
                    sx={styles.admin}
                >
                    {formatMessage(MESSAGES.isSuperUser)}
                </Typography>
            )}

            {!isSuperUser && (
                <>
                    <Box mb={2} width="50%">
                        <InputComponent
                            keyValue="userRoles"
                            onChange={handleChangeUserRoles}
                            value={parseUserPermissions(
                                currentUser.userRoles.value,
                            )}
                            type="select"
                            multi
                            label={MESSAGES.userRoles}
                            options={userRoles}
                            loading={isFetching}
                            clearable
                        />
                    </Box>
                    <Box sx={styles.tableStyle}>
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
