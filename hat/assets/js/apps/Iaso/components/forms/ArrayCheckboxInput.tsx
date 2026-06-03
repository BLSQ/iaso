import React from 'react';
import {
    Checkbox,
    FormControlLabel,
    FormControlLabelProps,
} from '@mui/material';
import { FieldInputProps, FormikProps } from 'formik';

type Props<T> = Omit<FormControlLabelProps, 'control' | 'label'> & {
    label?: string;
    field: FieldInputProps<T[]>;
    form: FormikProps<any>;
    onChange?: (value: boolean) => void;
    value: T;
};
export const ArrayCheckboxInput = <T,>({
    field,
    form,
    value,
    label,
    onChange,
    ...props
}: Props<T>) => {
    const currentValue = field.value || [];

    const checked = currentValue.includes(value);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.checked) {
            form.setFieldValue(field.name, [...currentValue, value]);
        } else {
            form.setFieldValue(
                field.name,
                currentValue.filter(v => v !== value),
            );
        }
    };

    return (
        <FormControlLabel
            control={
                <Checkbox
                    checked={checked}
                    onChange={onChange ?? handleChange}
                />
            }
            label={label}
            {...props}
        />
    );
};
