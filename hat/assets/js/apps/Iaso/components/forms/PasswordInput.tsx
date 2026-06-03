import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { get } from 'lodash';

type Props = {
    field?: Record<string, any>;
    form?: Record<string, any>;
    label?: string;
} & Omit<
    TextFieldProps,
    'type' | 'multiline' | 'value' | 'error' | 'helperText' | 'fullWidth'
>;

const PasswordInput = ({
    field = {},
    form = {},
    label = '',
    size = 'medium',
    variant = 'outlined',
    ...props
}: Props) => {
    const value = field.value || '';
    const initialValue = get(form.initialValues, field.name);
    const hasError = Boolean(get(form.errors, field.name));
    const isTouched = Boolean(get(form.touched, field.name));
    const displayError =
        form.errors &&
        hasError &&
        (initialValue !== field.value ||
            (isTouched && initialValue === field.value));
    return (
        <TextField
            fullWidth
            label={label}
            variant={variant}
            size={size}
            {...props}
            {...field}
            type={'password'}
            multiline={false}
            value={value}
            error={displayError}
            helperText={displayError && get(form.errors, field.name)}
        />
    );
};

export default PasswordInput;
