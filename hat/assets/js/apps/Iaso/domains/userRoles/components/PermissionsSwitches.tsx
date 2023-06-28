import React from 'react';
import { FormControlLabel, Switch } from '@material-ui/core';
// @ts-ignore
import { useSafeIntl, LoadingSpinner } from 'bluesquare-components';

import MESSAGES from '../messages';
import { useSnackQuery } from '../../../libs/apiHooks';
import { getRequest } from '../../../libs/Api';

type Permission = {
    id: number;
    name: string;
    codename: string;
};

type Props = {
    userRolePermissions: Array<Permission>;
    // eslint-disable-next-line no-unused-vars
    handleChange: (newValue: any) => void;
};

type PermissionResult = {
    permissions: Array<Permission>;
};

const PermissionsSwitches: React.FunctionComponent<Props> = ({
    userRolePermissions,
    handleChange,
}) => {
    const { formatMessage } = useSafeIntl();
    const { data, isLoading } = useSnackQuery<PermissionResult>(
        ['permissions'],
        () => getRequest('/api/permissions/'),
        MESSAGES.fetchPermissionsError,
    );

    const setPermissions = (permission: Permission, isChecked: boolean) => {
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
    };

    const permissionLabel = permissionCodeName => {
        return MESSAGES[permissionCodeName]
            ? formatMessage(MESSAGES[permissionCodeName])
            : permissionCodeName;
    };
    const permissions = data?.permissions ?? [];

    return (
        <>
            {isLoading && <LoadingSpinner />}

            {permissions
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
                            label={permissionLabel(p.name)}
                        />
                    </div>
                ))}
        </>
    );
};

export default PermissionsSwitches;
