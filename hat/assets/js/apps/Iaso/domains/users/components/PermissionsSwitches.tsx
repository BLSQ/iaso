import React from 'react';
import {
    FormControlLabel,
    Switch,
    Typography,
    makeStyles,
} from '@material-ui/core';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';

import MESSAGES from '../messages';
import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

const styles = theme => ({
    admin: {
        color: theme.palette.success.main,
    },
});

const useStyles = makeStyles(styles);

type Props = {
    isSuperUser?: boolean;
    currentUser: any;
    // eslint-disable-next-line no-unused-vars
    handleChange: (newValue: any) => void;
};

type Permission = {
    id: number;
    codename: string;
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

    // Get the translated label for the permission.
    // or permission's codename if not translation exist
    const permissionLabel = permissionCodeName => {
        return MESSAGES[permissionCodeName]
            ? formatMessage(MESSAGES[permissionCodeName])
            : permissionCodeName;
    };
    const permissions = data?.permissions ?? [];

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
            {!isSuperUser &&
                permissions
                    .sort((a, b) =>
                        permissionLabel(a.codename).localeCompare(
                            permissionLabel(b.codename),
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
                                            currentUser.permissions.value.find(
                                                up => up === p.codename,
                                            ),
                                        )}
                                        onChange={e =>
                                            setPermissions(
                                                p.codename,
                                                e.target.checked,
                                            )
                                        }
                                        name={p.codename}
                                        color="primary"
                                    />
                                }
                                label={permissionLabel(p.codename)}
                            />
                        </div>
                    ))}
        </>
    );
};

PermissionsSwitches.defaultProps = {
    isSuperUser: false,
};

export default PermissionsSwitches;
