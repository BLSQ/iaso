import { Switch } from '@mui/material';
import React from 'react';
import { Permission } from '../../userRoles/types/userRoles';

type Props = {
    value: string | Permission;
    codeName: string;
    settings: any;
    // eslint-disable-next-line no-unused-vars
    setPermissions: (permission: string | Permission, checked: boolean) => void;
    permissions: Permission[];
};

const PermissionSwitch: React.FunctionComponent<Props> = ({
    value,
    codeName,
    settings,
    setPermissions,
    permissions,
}) => {
    if (!settings.row.original.group) {
        return (
            <Switch
                className="permission-checkbox"
                id={`permission-checkbox-${settings.row.original[codeName]}`}
                checked={Boolean(
                    permissions.find(up => {
                        return typeof up === 'string'
                            ? up === settings.row.original[codeName]
                            : up.codename === settings.row.original[codeName];
                    }),
                )}
                onChange={e => {
                    setPermissions(value, e.target.checked);
                }}
                name={settings.row.original[codeName]}
                color="primary"
            />
        );
    }
    return null;
};

export default PermissionSwitch;
