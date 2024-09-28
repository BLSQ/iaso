import React from 'react';
import { Permission } from '../../userRoles/types/userRoles';
import InputComponent from '../../../components/forms/InputComponent';
import PERMISSIONS_MESSAGES from '../permissionsMessages';

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
        checkBoxKeys: string[] = [],
        checkBoxs: any = undefined,
        key: string | null,
    ) => {
        const permissionsToCheckOrUncheck = [permission];
        if (checkBoxKeys.length > 1 && checkBoxKeys[1] === key && checked) {
            permissionsToCheckOrUncheck.push(checkBoxs[checkBoxKeys[0]]);
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

    const renderCheckbox = (
        permissionCode: string,
        permission: string | Permission,
        key: string | null,
        checkBoxKeys: string[] = [],
        checkBoxs: any = undefined,
    ) => {
        const checkBoxLabel =
            key !== null
                ? { label: PERMISSIONS_MESSAGES[key] }
                : { labelString: '' };

        const disabled =
            checkBoxKeys.length > 1 &&
            key === checkBoxKeys[0] &&
            permissions.includes(checkBoxs[checkBoxKeys[1]]);

        return (
            <InputComponent
                type="checkbox"
                keyValue={`permission-checkbox-${permissionCode}`}
                value={isChecked(permissionCode)}
                onChange={(_, checked) =>
                    handleCheckboxChange(
                        permission,
                        checked,
                        checkBoxKeys,
                        checkBoxs,
                        key,
                    )
                }
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...checkBoxLabel}
                dataTestId="permission-checkbox"
                withMarginTop={false}
                // eslint-disable-next-line react/jsx-props-no-spreading
                disabled={disabled}
            />
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
                                      };

                            return (
                                <span key={permissionKey}>
                                    {renderCheckbox(
                                        original.readEdit[permissionKey],
                                        val,
                                        permissionKey,
                                        checkBoxKeys,
                                        original.readEdit,
                                    )}
                                </span>
                            );
                        },
                    )}
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
