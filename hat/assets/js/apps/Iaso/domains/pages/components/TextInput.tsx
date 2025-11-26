import React, { FunctionComponent } from 'react';
import { TextField } from '@mui/material';
import { get } from 'lodash';

type Props = {
    field?: Record<string, any>;
    form?: Record<string, any>;
    label?: string;
    multiline?: boolean;
};
const TextInput: FunctionComponent<Props> = ({
    field = {},
    form = {},
    label = '',
    multiline = false,
}) => {
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
            variant="outlined"
            size="medium"
            {...field}
            multiline={multiline}
            value={value}
            error={displayError}
            helperText={displayError && get(form.errors, field.name)}
        />
    );
};

export default TextInput;
