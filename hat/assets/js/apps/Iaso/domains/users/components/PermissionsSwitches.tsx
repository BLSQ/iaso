import React from 'react';
import { Typography, makeStyles } from '@material-ui/core';
import {
    useSafeIntl,
    LoadingSpinner,
    Table,
    Column,
} from 'bluesquare-components';
import MESSAGES from '../messages';
import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';
import { useUserPermissionColumns } from '../config';
import { useGetUserPermissions } from '../hooks/useGetUserPermissions';
import { Permission } from '../../userRoles/types/userRoles';

const styles = theme => ({
    admin: {
        color: theme.palette.success.main,
    },
    tableCellStyle: {
        border: '1px solid grey',
    },
});

const useStyles = makeStyles(styles);

type Props = {
    isSuperUser?: boolean;
    currentUser: any;
    // eslint-disable-next-line no-unused-vars
    handleChange: (newValue: any) => void;
};

type PermissionResult = {
    permissions: Permission[];
};

const PermissionsSwitches: React.FunctionComponent<Props> = ({
    isSuperUser,
    currentUser,
    handleChange,
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
                    columns={columns}
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
