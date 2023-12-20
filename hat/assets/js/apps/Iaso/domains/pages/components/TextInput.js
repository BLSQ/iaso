import React from 'react';
import PropTypes from 'prop-types';
import { TextField } from '@mui/material';
import { get } from 'lodash';

const TextInput = ({ field, form, label, multiline, ...props } = {}) => {
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
            {...props}
            {...field}
            multiline={multiline}
            value={value}
            error={displayError}
            helperText={displayError && get(form.errors, field.name)}
        />
    );
};

TextInput.defaultProps = {
    field: {},
    form: {},
    label: '',
    multiline: false,
};

TextInput.propTypes = {
    field: PropTypes.object,
    form: PropTypes.object,
    label: PropTypes.string,
    multiline: PropTypes.bool,
};

export default TextInput;
