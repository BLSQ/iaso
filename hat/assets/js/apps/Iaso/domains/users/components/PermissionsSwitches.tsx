import React, { useCallback } from 'react';
import { Box, Typography, makeStyles } from '@material-ui/core';
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

const styles = theme => ({
    admin: {
        color: theme.palette.success.main,
    },
    tableCellStyle: {
        border: '1px solid grey',
    },
    tableStyle: {
        maxHeight: '70vh',
        overflow: 'scroll',
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

    const allPermissions = data?.permissions ?? [];
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
            setFieldValue('user_roles', value ? value.split(',') : []);
            console.log('value', value);
            // const permissions =
            // setFieldValue('user_permissions', permissions)
        },
        [setFieldValue],
    );

    console.log('userRoles', userRoles);
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
                    <Box className={classes.tableStyle}>
                        <Table
                            columns={columns}
                            data={permissionsData}
                            showPagination={false}
                            countOnTop={false}
                            extraProps={{ currentUser, userPermissions }}
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
