import React, { useMemo } from 'react';
import { DropdownOptions } from 'bluesquare-components';
import { FormikProps } from 'formik';
import { FieldInputProps } from 'formik/dist/types';
import { get } from 'lodash';
import InputComponent, {
    InputComponentProps,
} from 'Iaso/components/forms/InputComponent';

export type SelectInputProps<T, TSchema, TValues> = {
    options: DropdownOptions<T>[];
    field: FieldInputProps<TSchema>;
    form: FormikProps<TValues>;
    label: string;
} & Omit<
    InputComponentProps,
    'keyValue' | 'errors' | 'type' | 'label' | 'labelString' | 'options'
>;

export const SelectInput = <T, TSchema, TValues>({
    options,
    label,
    field,
    form,
    onChange,
    ...props
}: SelectInputProps<T, TSchema, TValues>) => {
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
            value={field.value}
            options={options}
            labelString={label}
            onChange={(keyValue, value) => {
                if (onChange) {
                    onChange(keyValue, value);
                }
                form.setFieldTouched(field.name, true);
                form.setFieldValue(field.name, value);
            }}
            errors={hasError ? errors : []}
            {...props}
        />
    );
};
