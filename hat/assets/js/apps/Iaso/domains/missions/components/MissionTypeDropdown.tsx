import React, { FunctionComponent } from 'react';
import { FormikProps, FieldInputProps } from 'formik';
import {
    MissionTypeEnum,
    useApiMicroplanningMissionsMissionTypesDropdownList,
} from 'Iaso/api/missions';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { userHasPermission } from 'Iaso/domains/users/utils';
import { MISSION_READ } from 'Iaso/utils/permissions';
import { useCurrentUser } from 'Iaso/utils/usersUtils';
import MESSAGES from '../messages';
export type ModulesDropdownProps = {
    handleChange?: (keyValue: string, value: string | number) => void;
    field?: FieldInputProps<any>;
    form?: FormikProps<any>;
    value?: MissionTypeEnum;
    keyValue?: string;
} & Omit<
    React.ComponentProps<typeof InputComponent>,
    'loading' | 'options' | 'type' | 'value' | 'string'
>;

export const MissionTypeDropdown: FunctionComponent<ModulesDropdownProps> = ({
    handleChange,
    label,
    value,
    keyValue,
    ...props
}) => {
    const currentUser = useCurrentUser();
    const hasPermission = userHasPermission(MISSION_READ, currentUser);

    const { data, isLoading } =
        useApiMicroplanningMissionsMissionTypesDropdownList({
            query: {
                enabled: hasPermission,
            },
        });

    return hasPermission ? (
        <InputComponent
            keyValue={keyValue}
            type="select"
            value={value}
            options={data ?? []}
            label={label ?? MESSAGES.missionType}
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
