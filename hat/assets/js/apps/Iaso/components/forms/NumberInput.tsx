import React, { useMemo } from 'react';
import { FormikProps } from 'formik';
import { FieldInputProps } from 'formik/dist/types';
import { get } from 'lodash';
import InputComponent, {
    InputComponentProps,
} from 'Iaso/components/forms/InputComponent';

export type NumberInputProps<TSchema, TValues> = {
    field: FieldInputProps<TSchema>;
    form: FormikProps<TValues>;
    label: string;
} & Omit<
    InputComponentProps,
    | 'keyValue'
    | 'type'
    | 'value'
    | 'label'
    | 'labelString'
    | 'options'
    | 'errors'
>;

export const NumberInput = <TSchema, TValues>({
    label,
    field,
    form,
    onChange,
    ...props
}: NumberInputProps<TSchema, TValues>) => {
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
            type="number"
            value={field.value}
            labelString={label}
            onChange={(keyValue, value) => {
                if (onChange) onChange(keyValue, value);
                form.setFieldTouched(field.name, true);
                form.setFieldValue(field.name, value);
            }}
            errors={hasError ? errors : []}
            {...props}
        />
    );
};
