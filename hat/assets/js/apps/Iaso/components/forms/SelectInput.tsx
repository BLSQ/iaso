import React, { useMemo } from 'react';
import { DropdownOptions } from 'bluesquare-components';
import { get } from 'lodash';
import InputComponent from 'Iaso/components/forms/InputComponent';

export type SelectInputProps<T> = {
    options: DropdownOptions<T>[];
    label: string;
    field: Record<string, any>;
    form: Record<string, any>;
    withMarginTop?: boolean;
    clearable?: boolean;
    required?: boolean;
    disabled?: boolean;
    onChange?: (_keyValue: string, value: any) => void;
    renderTags?: (tagValue: Array<any>, getTagProps: any) => Array<any>;
    freeSolo?: boolean;
    loading?: boolean;
};

export const SelectInput = <T,>({
    options,
    label,
    field,
    form,
    onChange,
    renderTags,
    disabled = false,
    clearable = true,
    withMarginTop = false,
    required = false,
    freeSolo = false,
    loading = false,
}: SelectInputProps<T>) => {
    const hasError =
        form.errors &&
        Boolean(get(form.errors, field.name) && get(form.touched, field.name));
    const errors = useMemo(
        () => [get(form.errors, field.name)],
        [field.name, form.errors],
    );

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
            loading={loading}
            renderTags={renderTags}
            onChange={(keyValue, value) => {
                if (onChange) {
                    onChange(keyValue, value);
                }
                form.setFieldTouched(field.name, true);
                form.setFieldValue(field.name, value);
            }}
            errors={hasError ? errors : []}
            freeSolo={freeSolo}
        />
    );
};
