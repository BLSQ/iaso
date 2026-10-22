import React, { FunctionComponent } from 'react';
import { FormikProps, FieldInputProps } from 'formik';
import {
    type ApiMicroplanningMissionsDropdownListParams,
    useApiMicroplanningMissionsDropdownList,
} from 'Iaso/api/missions';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { userHasPermission } from 'Iaso/domains/users/utils';
import { MISSION_READ } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from '../messages';
export type MissionDropdownProps = {
    handleChange?: (keyValue: string, value: string | number) => void;
    field?: FieldInputProps<any>;
    form?: FormikProps<any>;
    value?: number | number[];
    params?: ApiMicroplanningMissionsDropdownListParams;
} & Omit<
    React.ComponentProps<typeof InputComponent>,
    'loading' | 'options' | 'type' | 'value' | 'string'
>;

export const MissionDropdown: FunctionComponent<MissionDropdownProps> = ({
    handleChange,
    label,
    value,
    params,
    ...props
}) => {
    const currentUser = useCurrentUser();
    const hasPermission = userHasPermission(MISSION_READ, currentUser);

    const { data, isLoading } = useApiMicroplanningMissionsDropdownList(
        params,
        {
            query: {
                enabled: hasPermission,
            },
        },
    );

    return hasPermission ? (
        <InputComponent
            type="select"
            value={value}
            options={data ?? []}
            label={label ?? MESSAGES.missions}
            onChange={(keyValue, value) => {
                if (handleChange) {
                    handleChange(keyValue, value);
                }
            }}
            loading={isLoading}
            {...props}
        />
    ) : null;
};
