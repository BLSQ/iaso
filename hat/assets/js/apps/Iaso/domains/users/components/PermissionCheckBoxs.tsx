import React from 'react';
import { Permission } from '../../userRoles/types/userRoles';
import PermissionCheckbox from './PermissionCheckbox';

type Props = {
    value: string | Permission;
    codeName: string;
    settings: any;
    // eslint-disable-next-line no-unused-vars
    setPermissions: (permission: string | Permission, checked: boolean) => void;
    permissions: Permission[];
    type: string;
};

const PermissionCheckBoxs: React.FunctionComponent<Props> = ({
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
            if (type !== 'user') {
                permissionsToCheckOrUncheck.push({
                    codename: checkBoxs[checkBoxKeys[0]],
                    name: checkBoxs[checkBoxKeys[0]],
                    id: 0,
                });
            } else {
                permissionsToCheckOrUncheck.push(checkBoxs[checkBoxKeys[0]]);
            }

            setPermissions(permissionsToCheckOrUncheck, checked);
        } else {
            setPermissions(permission, checked);
        }
    };

    const isChecked = (permissionCode: string) => {
        return Boolean(
            permissions.find(up =>
                typeof up === 'string'
                    ? up === permissionCode
                    : up.codename === permissionCode,
            ),
        );
    };

    if (!original.group) {
        if (original.readEdit) {
            const checkBoxKeys = Object.keys(original.readEdit);
            return (
                <div style={{ display: 'inline-flex' }}>
                    {Object.entries(original.readEdit).map(
                        ([permissionKey]) => {
                            const val =
                                type === 'user'
                                    ? original.readEdit[permissionKey]
                                    : {
                                          codename:
                                              original.readEdit[permissionKey],
                                          name: original.readEdit[
                                              permissionKey
                                          ],
                                      };

                            return (
                                <span key={permissionKey}>
                                    <PermissionCheckbox
                                        permissionCode={
                                            original.readEdit[permissionKey]
                                        }
                                        permission={val}
                                        keyPermission={permissionKey}
                                        checkBoxKeys={checkBoxKeys}
                                        checkBoxs={original.readEdit}
                                        isChecked={isChecked}
                                        handleCheckboxChange={
                                            handleCheckboxChange
                                        }
                                        type={type}
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
                    type={type}
                    allPermissions={permissions}
                />
            </div>
        );
    }

    return null;
};

export default PermissionCheckBoxs;
