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
    permissions: Permission[];
};

const PermissionsSwitches: React.FunctionComponent<Props> = ({
    userRolePermissions,
    handleChange,
}) => {
    console.log('Kabisa', userRolePermissions);
    const { formatMessage } = useSafeIntl();
    const { data, isLoading } = useSnackQuery<PermissionResult>(
        ['permissions'],
        () => getRequest('/api/permissions/'),
        MESSAGES.fetchPermissionsError,
    );

    const setPermissions = (codeName: string, isChecked: boolean) => {
        const newUserRolePerms = userRolePermissions;
        if (!isChecked) {
            const permIndex = newUserRolePerms.indexOf(codeName);
            newUserRolePerms.splice(permIndex, 1);
        } else {
            newUserRolePerms.push(codeName);
        }
        handleChange(newUserRolePerms);
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
                            label={permissionLabel(p.name)}
                        />
                    </div>
                ))}
        </>
    );
};
PermissionsSwitches.defaultProps = {};
export default PermissionsSwitches;
