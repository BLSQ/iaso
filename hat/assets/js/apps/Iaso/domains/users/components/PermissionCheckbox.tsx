/* eslint-disable no-unused-vars */
import React from 'react';
import InputComponent from '../../../components/forms/InputComponent';
import PERMISSIONS_MESSAGES from '../permissionsMessages';
import { Permission } from '../../userRoles/types/userRoles';

type PermissionCheckboxProps = {
    permissionCode: string;
    permission: string | Permission;
    keyPermission: string | null;
    checkBoxKeys?: string[];
    checkBoxs?: any;
    isChecked: (permissionCode: string) => boolean;
    handleCheckboxChange: (
        permission: string | Permission,
        checked: boolean,
        keyPermission: string | null,
        checkBoxKeys?: string[],
        checkBoxs?: any,
    ) => void;
    allPermissions: (string | Permission)[];
};

const PermissionCheckbox: React.FunctionComponent<PermissionCheckboxProps> = ({
    permissionCode,
    permission,
    keyPermission,
    checkBoxKeys = [],
    checkBoxs = undefined,
    isChecked,
    handleCheckboxChange,
    allPermissions,
}) => {
    const checkBoxLabel =
        keyPermission !== null
            ? { label: PERMISSIONS_MESSAGES[keyPermission] }
            : { labelString: '' };

    const permissionsChecked = allPermissions;

    const disabled =
        checkBoxKeys.length > 1 &&
        keyPermission === checkBoxKeys[0] &&
        permissionsChecked.includes(checkBoxs[checkBoxKeys[1]]);

    return (
        <InputComponent
            type="checkbox"
            keyValue={`permission-checkbox-${permissionCode}`}
            value={isChecked(permissionCode)}
            onChange={(_, checked) =>
                handleCheckboxChange(
                    permission,
                    checked,
                    keyPermission,
                    checkBoxKeys,
                    checkBoxs,
                )
            }
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...checkBoxLabel}
            dataTestId="permission-checkbox"
            withMarginTop={false}
            disabled={disabled}
        />
    );
};

export default PermissionCheckbox;
