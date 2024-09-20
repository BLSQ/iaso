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
    const { original } = settings.row;

    const handleCheckboxChange = (
        permission: string | Permission,
        checked: boolean,
    ) => setPermissions(permission, checked);

    const isChecked = (permissionCode: string) => {
        return Boolean(
            permissions.find(up =>
                typeof up === 'string'
                    ? up === permissionCode
                    : up.codename === permissionCode,
            ),
        );
    };

    const renderCheckbox = (
        permissionCode: string,
        permission: string | Permission,
        key: string | null,
    ) => (
        <InputComponent
            type="checkbox"
            keyValue={`permission-checkbox-${permissionCode}`}
            value={isChecked(permissionCode)}
            onChange={(_, checked) => handleCheckboxChange(permission, checked)}
            labelString={!key ? '' : key}
            dataTestId="permission-checkbox"
        />
    );

    if (!original.group) {
        if (original.readEdit) {
            return (
                <div style={{ display: 'inline-flex' }}>
                    {Object.entries(original.readEdit).map(([key]) => {
                        const val =
                            type === 'user'
                                ? original.readEdit[key]
                                : {
                                      codename: original.readEdit[key],
                                      id: 0,
                                      name: original.readEdit[key],
                                  };

                        return renderCheckbox(original.readEdit[key], val, key);
                    })}
                </div>
            );
        }

        return (
            <div style={{ display: 'inline-flex' }}>
                {renderCheckbox(original[codeName], value, null)}
            </div>
        );
    }

    return null;
};

export default PermissionSwitch;
