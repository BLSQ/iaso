import React, { FunctionComponent } from 'react';
import { FormikProps, FieldInputProps } from 'formik';

import { useApiTeamsTypesDropdownList, Value8edEnum } from 'Iaso/api/teams';
import InputComponent from 'Iaso/components/forms/InputComponent';
import MESSAGES from '../messages';

export type TeamTypeDropdownProps = {
    handleChange?: (keyValue: string, value: string | number) => void;
    field?: FieldInputProps<any>;
    form?: FormikProps<any>;
    value?: Value8edEnum;
} & Omit<
    React.ComponentProps<typeof InputComponent>,
    'loading' | 'options' | 'type' | 'value' | 'string'
>;

export const TeamTypeDropdown: FunctionComponent<TeamTypeDropdownProps> = ({
    handleChange,
    label,
    value,
    ...props
}) => {
    const { data, isLoading } = useApiTeamsTypesDropdownList();

    return (
        <InputComponent
            type="select"
            value={value}
            options={data ?? []}
            label={label ?? MESSAGES.type}
            onChange={(keyValue, value) => {
                if (handleChange) {
                    handleChange(keyValue, value);
                }
            }}
            loading={isLoading}
            {...props}
        />
    );
};
