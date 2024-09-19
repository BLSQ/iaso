import React from 'react';
import { Permission } from '../../userRoles/types/userRoles';
import InputComponent from '../../../components/forms/InputComponent';

type Props = {
    value: string | Permission;
    codeName: string;
    settings: any;
    // eslint-disable-next-line no-unused-vars
    setPermissions: (permission: string | Permission, checked: boolean) => void;
    permissions: Permission[];
    type: string;
};

const PermissionSwitch: React.FunctionComponent<Props> = ({
    value,
    codeName,
    settings,
    setPermissions,
    permissions,
    type,
}) => {
    if (!settings.row.original.group) {
        if (settings.row.original.readEdit) {
            const valRead =
                type === 'user'
                    ? settings.row.original.readEdit.read
                    : {
                          codename: settings.row.original.readEdit.read,
                          id: 0,
                          name: settings.row.original.readEdit.read,
                      };
            const valEdit =
                type === 'user'
                    ? settings.row.original.readEdit.edit
                    : {
                          codename: settings.row.original.readEdit.edit,
                          id: 0,
                          name: settings.row.original.readEdit.edit,
                      };
            return (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                    }}
                >
                    <InputComponent
                        type="checkbox"
                        keyValue={`permission-checkbox-${settings.row.original.readEdit.read}`}
                        value={Boolean(
                            permissions.find(up => {
                                return typeof up === 'string'
                                    ? up === settings.row.original.readEdit.read
                                    : up.codename ===
                                          settings.row.original.readEdit.read;
                            }),
                        )}
                        onChange={(_, checked) => {
                            setPermissions(valRead, checked);
                        }}
                        labelString=""
                        dataTestId="permission-checkbox"
                    />
                    <InputComponent
                        type="checkbox"
                        keyValue={`permission-checkbox-${settings.row.original.readEdit.edit}`}
                        value={Boolean(
                            permissions.find(up => {
                                return typeof up === 'string'
                                    ? up === settings.row.original.readEdit.edit
                                    : up.codename ===
                                          settings.row.original.readEdit.edit;
                            }),
                        )}
                        onChange={(_, checked) => {
                            setPermissions(valEdit, checked);
                        }}
                        labelString=""
                        dataTestId="permission-checkbox"
                    />
                </div>
            );
        }
        return (
            <InputComponent
                type="checkbox"
                keyValue={`permission-checkbox-${settings.row.original[codeName]}`}
                value={Boolean(
                    permissions.find(up => {
                        return typeof up === 'string'
                            ? up === settings.row.original[codeName]
                            : up.codename === settings.row.original[codeName];
                    }),
                )}
                onChange={(_, checked) => {
                    setPermissions(value, checked);
                }}
                labelString=""
                dataTestId="permission-checkbox"
            />
        );
    }
    return null;
};

export default PermissionSwitch;
