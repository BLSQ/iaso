import { get } from 'lodash';
import React, { FunctionComponent } from 'react';
import { DropdownOptions } from '../../../types/utils';
import InputComponent from '../../../components/forms/InputComponent';

type Props = {
    options: DropdownOptions<number>[];
    label: string;
    field: Record<string, any>;
    form: Record<string, any>;
    withMarginTop?: boolean;
    clearable?: boolean;
    required?: boolean;
    disabled?: boolean;
    // eslint-disable-next-line no-unused-vars
    onChange?: (_keyValue: string, value: any) => void;
};

export const SingleSelect: FunctionComponent<Props> = ({
    options,
    label,
    field,
    form,
    onChange,
    disabled = false,
    clearable = true,
    withMarginTop = false,
    required = false,
}) => {
    const hasError =
        form.errors &&
        Boolean(get(form.errors, field.name) && get(form.touched, field.name));

    return (
        <InputComponent
            keyValue={field.name}
            type="select"
            withMarginTop={withMarginTop}
            value={field.value}
            options={options}
            disabled={disabled}
            clearable={clearable}
            required={required}
            labelString={label}
            onChange={(keyValue, value) => {
                if (onChange) {
                    onChange(keyValue, value);
                } else {
                    form.setFieldTouched(field.name, true);
                    form.setFieldValue(field.name, value);
                }
            }}
            errors={hasError ? [get(form.errors, field.name)] : []}
        />
    );
};
