import React, { useCallback, useMemo } from 'react';
import { Box, FormControlLabel, Switch, makeStyles } from '@material-ui/core';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';

import MESSAGES from '../messages';
import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';
import { Permission } from '../types/userRoles';

const styles = theme => ({
    container: {
        marginTop: theme.spacing(2),
        padding: theme.spacing(1),
        maxHeight: '60vh',
        overflow: 'scroll',
        border: `1px solid ${theme.palette.border.main}`,
    },
});

const useStyles = makeStyles(styles);

type Props = {
    userRolePermissions: Permission[];
    // eslint-disable-next-line no-unused-vars
    handleChange: (newValue: any) => void;
};

export const PermissionsSwitches: React.FunctionComponent<Props> = ({
    userRolePermissions,
    handleChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const { data, isLoading } = useSnackQuery<{ permissions: Permission[] }>(
        ['permissions'],
        () => getRequest('/api/permissions/'),
        MESSAGES.fetchPermissionsError,
    );

    const setPermissions = useCallback(
        (permission: Permission, isChecked: boolean) => {
            const newUserPerms = [...userRolePermissions];
            if (!isChecked) {
                const permIndex = newUserPerms.findIndex(item => {
                    return item.codename === permission.codename;
                });
                newUserPerms.splice(permIndex, 1);
            } else {
                newUserPerms.push(permission);
            }
            handleChange(newUserPerms);
        },
        [handleChange, userRolePermissions],
    );

    const getPermissionLabel = permissionCodeName => {
        return MESSAGES[permissionCodeName]
            ? formatMessage(MESSAGES[permissionCodeName])
            : permissionCodeName;
    };
    const permissions = useMemo(
        () => data?.permissions ?? [],
        [data?.permissions],
    );

    return (
        <Box className={classes.container}>
            {isLoading && <LoadingSpinner />}

            {permissions
                .sort((a, b) =>
                    getPermissionLabel(a.codename).localeCompare(
                        getPermissionLabel(b.codename),
                        undefined,
                        {
                            sensitivity: 'accent',
                        },
                    ),
                )
                .map(p => (
                    <div key={p.id}>
                        <FormControlLabel
                            control={
                                <Switch
                                    className="permission-checkbox"
                                    id={`permission-checkbox-${p.codename}`}
                                    checked={Boolean(
                                        userRolePermissions.find(
                                            up => up.codename === p.codename,
                                        ),
                                    )}
                                    onChange={e =>
                                        setPermissions(p, e.target.checked)
                                    }
                                    name={p.codename}
                                    color="primary"
                                />
                            }
                            label={getPermissionLabel(p.codename)}
                        />
                    </div>
                ))}
        </Box>
    );
};
