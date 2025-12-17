import React, { FunctionComponent, useCallback } from 'react';
import { TextField } from '@mui/material';
import { get } from 'lodash';

type Props = {
    field?: Record<string, any>;
    form?: Record<string, any>;
    value?: any;
    touchOnFocus?: boolean;
    shrinkLabel?: boolean;
    required?: boolean;
    className?: string;
};
export const TextInput: FunctionComponent<Props> = ({
    field = {},
    form = {},
    className,
    value,
    touchOnFocus = true,
    shrinkLabel = true,
    required = false,
    ...props
}) => {
    const hasError =
        form.errors &&
        Boolean(get(form.errors, field.name) && get(form.touched, field.name));

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
            className={className}
        />
    );
};
