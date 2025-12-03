import React, { FocusEventHandler, FunctionComponent, ReactNode } from 'react';
import { CircularProgress } from '@mui/material';
import TextField from '@mui/material/TextField';
import { FormControl } from './FormControl';
import { useStyles } from './SingleSelect';
import { textPlaceholder } from 'bluesquare-components';

type Props = {
    params: Record<string, any>;
    disabled: boolean;
    required: boolean;
    onBlur: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
    errors: string[];
    loading: boolean;
    renderOption?: (arg: { label: string }) => ReactNode;
    label?: string;
    helperText?: ReactNode;
    autoComplete?: string;
    placeholder?: string;
    dataTestId?: string;
};

export const TextInput: FunctionComponent<Props> = ({
    params,
    renderOption,
    disabled,
    label,
    required,
    onBlur,
    errors,
    helperText,
    loading,
    placeholder = textPlaceholder,
    dataTestId = '',
    autoComplete = 'off',
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
