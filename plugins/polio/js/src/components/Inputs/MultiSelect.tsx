import { get } from 'lodash';
import React, { FunctionComponent } from 'react';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { DropdownOptions } from '../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { isTouched } from '../../utils';

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

export const MultiSelect: FunctionComponent<Props> = ({
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
        Boolean(get(form.errors, field.name) && isTouched(form.touched));
    return (
        <InputComponent
            keyValue={field.name}
            type="select"
            withMarginTop={withMarginTop}
            value={field.value}
            multi
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
