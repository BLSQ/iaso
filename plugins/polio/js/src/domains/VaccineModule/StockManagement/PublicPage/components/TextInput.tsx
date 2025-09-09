import React from 'react';
import { CircularProgress } from '@mui/material';
import TextField from '@mui/material/TextField';
import PropTypes from 'prop-types';

import { FormControl } from './FormControl';
import { useStyles } from './SingleSelect';

const TextInput = ({
    params,
    renderOption,
    disabled,
    label,
    required,
    onBlur,
    errors,
    helperText,
    loading,
    autoComplete,
    placeholder,
    dataTestId,
}) => {
    const classes = useStyles();
    const paramsCopy = {
        ...params,
    };
    let inputExtraProps = {};
    if (renderOption && params.inputProps.value) {
        inputExtraProps = {
            startAdornment: (
                <div>
                    {renderOption({
                        label: params.inputProps.value,
                    })}
                </div>
            ),
            style: { color: 'transparent' },
        };
        paramsCopy.inputProps.value = '';
    }
    return (
        <FormControl errors={errors}>
            <TextField
                {...paramsCopy}
                variant="outlined"
                disabled={disabled}
                label={label ? `${label}${required ? '*' : ''}` : undefined}
                onBlur={onBlur}
                error={errors.length > 0}
                InputLabelProps={{
                    classes: {
                        shrink: classes.shrink,
                    },
                    className: classes.inputLabel,
                }}
                helperText={helperText}
                InputProps={{
                    ...params.InputProps,
                    autoComplete,
                    placeholder,
                    'data-test': dataTestId,
                    endAdornment: (
                        <>
                            {loading ? (
                                <CircularProgress color="inherit" size={20} />
                            ) : null}
                            {params.InputProps.endAdornment}
                        </>
                    ),
                    ...inputExtraProps,
                }}
            />
        </FormControl>
    );
};

TextInput.defaultProps = {
    helperText: null,
    renderOption: null,
    autoComplete: 'off',
    label: undefined,
    dataTestId: undefined,
    placeholder: '',
};

TextInput.propTypes = {
    renderOption: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    params: PropTypes.object.isRequired,
    disabled: PropTypes.bool.isRequired,
    label: PropTypes.string,
    required: PropTypes.bool.isRequired,
    onBlur: PropTypes.func.isRequired,
    errors: PropTypes.array.isRequired,
    helperText: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    loading: PropTypes.bool.isRequired,
    autoComplete: PropTypes.string,
    placeholder: PropTypes.string,
    dataTestId: PropTypes.string,
};
export { TextInput };
