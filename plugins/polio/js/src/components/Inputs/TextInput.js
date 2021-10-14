import React from 'react';
import PropTypes from 'prop-types';
import { TextField } from '@material-ui/core';
import { get } from 'lodash';

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

TextInput.defaultProps = {
    field: {},
    form: {},
    value: undefined,
};

TextInput.propTypes = {
    field: PropTypes.object,
    form: PropTypes.object,
    value: PropTypes.any,
};
