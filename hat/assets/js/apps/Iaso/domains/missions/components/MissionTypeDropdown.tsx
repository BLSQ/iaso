import React, { FunctionComponent } from 'react';
import { FormikProps, FieldInputProps } from 'formik';
import { get } from 'lodash';
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
    field,
    form,
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

    const inputKeyValue = field ? field.name : keyValue;
    const inputValue = field ? field.value : value;

    const hasError =
        form && field ? Boolean(get(form.errors, field.name)) : false;

    return hasPermission ? (
        <InputComponent
            {...field}
            keyValue={inputKeyValue}
            type="select"
            value={inputValue}
            options={data ?? []}
            label={label ?? MESSAGES.missionType}
            onChange={(keyValue, value) => {
                if (handleChange) {
                    handleChange(keyValue, value);
                } else if (form && field) {
                    form.setFieldTouched(field.name, true);
                    form.setFieldValue(field.name, value);
                }
            }}
            errors={hasError ? get(form.errors, field.name) : []}
            loading={isLoading}
            {...props}
        />
    ) : null;
};
