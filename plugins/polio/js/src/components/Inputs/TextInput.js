import React from 'react';
import { TextField } from '@material-ui/core';
import get from 'lodash.get';

export const TextInput = ({ field = {}, form = {}, value, ...props } = {}) => {
    return (
        <TextField
            InputLabelProps={{
                shrink: true,
            }}
            fullWidth
            variant="outlined"
            size="medium"
            {...props}
            {...field}
            value={field.value ?? value ?? ''}
            error={form.errors && Boolean(get(form.errors, field.name))}
            helperText={form.errors && get(form.errors, field.name)}
        />
    );
};
