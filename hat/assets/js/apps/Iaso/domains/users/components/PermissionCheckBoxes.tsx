/* eslint-disable no-unused-vars */
import React, { useCallback } from 'react';
import { Permission } from '../../userRoles/types/userRoles';
import PermissionCheckbox from './PermissionCheckbox';

type Props = {
    value: string | Permission;
    codeName: string;
    settings: any;

    setPermissions: (
        permission: (string | Permission) | (string | Permission)[],
        checked: boolean,
    ) => void;
    permissions: (string | Permission)[];
};

const PermissionCheckBoxes: React.FunctionComponent<Props> = ({
    value,
    codeName,
    settings,
    setPermissions,
    permissions,
}) => {
    const { original } = settings.row;

    const handleCheckboxChange = useCallback(
        (
            permission: string | Permission,
            checked: boolean,
            keyPermission: string | null,
            checkBoxKeys: string[] = [],
            checkBoxs: any = undefined,
        ) => {
            const permissionsToCheckOrUncheck = [permission];
            if (
                checkBoxKeys.length > 1 &&
                checkBoxKeys[1] === keyPermission &&
                checked
            ) {
                permissionsToCheckOrUncheck.push(checkBoxs[checkBoxKeys[0]]);
                setPermissions(permissionsToCheckOrUncheck, checked);
            } else {
                setPermissions(permission, checked);
            }
        },
        [setPermissions],
    );

    const isChecked = (permissionCode: string) => {
        return Boolean(permissions.find(up => up === permissionCode));
    };

    if (!original.group) {
        if (original.readEdit) {
            const checkBoxKeys = Object.keys(original.readEdit);
            return (
                <div style={{ display: 'inline-flex' }}>
                    {Object.entries(original.readEdit).map(
                        ([permissionKey]) => {
                            const permissionCode =
                                original.readEdit[permissionKey];

                            return (
                                <span key={permissionKey}>
                                    <PermissionCheckbox
                                        permissionCode={permissionCode}
                                        permission={permissionCode}
                                        keyPermission={permissionKey}
                                        checkBoxKeys={checkBoxKeys}
                                        checkBoxs={original.readEdit}
                                        isChecked={isChecked}
                                        handleCheckboxChange={
                                            handleCheckboxChange
                                        }
                                        allPermissions={permissions}
                                    />
                                </span>
                            );
                        },
                    )}
                </div>
            );
        }

        return (
            <div style={{ display: 'inline-flex' }}>
                <PermissionCheckbox
                    permissionCode={original[codeName]}
                    permission={value}
                    keyPermission={null}
                    isChecked={isChecked}
                    handleCheckboxChange={handleCheckboxChange}
                    allPermissions={permissions}
                />
            </div>
        );
    }

    return null;
};

export default PermissionCheckBoxes;
