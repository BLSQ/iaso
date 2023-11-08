import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { TextField } from '@material-ui/core';
import { get } from 'lodash';
import { isTouched } from '../../utils';

export const TextInput = ({
    field = {},
    form = {},
    value,
    touchOnFocus = true,
    shrinkLabel = true,
    ...props
} = {}) => {
    const hasError =
        form.errors &&
        Boolean(get(form.errors, field.name) && isTouched(form.touched));

    const handleChangeAndFocus = useCallback(
        e => {
            form?.setFieldTouched(field.name, true);
            field?.onChange(e);
        },
        [form, field],
    );

    return (
        <TextField
            InputLabelProps={{
                shrink: Boolean(field.value ?? value ?? '') || shrinkLabel,
            }}
            fullWidth
            variant="outlined"
            size="medium"
            {...props}
            {...field}
            onFocus={
                touchOnFocus
                    ? () => form.setFieldTouched(field.name, true)
                    : () => null
            }
            onBlur={touchOnFocus ? field.onBlur : undefined}
            onChange={touchOnFocus ? field.onChange : handleChangeAndFocus}
            value={field.value ?? value ?? ''}
            error={hasError}
            helperText={hasError ? get(form.errors, field.name) : undefined}
        />
    );
};

TextInput.defaultProps = {
    field: {},
    form: {},
    value: undefined,
    touchOnFocus: true,
    shrinkLabel: true,
};

TextInput.propTypes = {
    field: PropTypes.object,
    form: PropTypes.object,
    value: PropTypes.any,
    touchOnFocus: PropTypes.bool,
    shrinkLabel: PropTypes.bool,
};
