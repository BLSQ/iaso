import React, {
    useState,
    useEffect,
    useCallback,
    useRef,
    useMemo,
} from 'react';
import PropTypes from 'prop-types';
import { useDebounce } from 'use-debounce';
import { TextField } from '@material-ui/core';
import { useSkipEffectOnMount } from 'bluesquare-components';
import { get } from 'lodash';

export const TextInput = ({
    field = {},
    form = {},
    value,
    touchOnFocus = true,
    debounceTime = 500,
    ...props
} = {}) => {
    const prevValue = useRef();
    const prevDebounced = useRef();
    const [textValue, setTextValue] = useState(value ?? '');
    const [debouncedValue] = useDebounce(textValue, debounceTime);

    const hasError =
        form.errors &&
        Boolean(get(form.errors, field.name) && get(form.touched, field.name));

    const handleChangeAndFocus = useCallback(
        newValue => {
            form?.setFieldTouched(field.name, true);
            form.setFieldValue(field.name, newValue);
        },
        [form, field],
    );

    const handleChange = useMemo(
        () => (touchOnFocus ? field.onChange : handleChangeAndFocus),
        [field.onChange, handleChangeAndFocus, touchOnFocus],
    );

    // Reset state when value changes to prevent wrongly persisting the state value
    useEffect(() => {
        if (value !== prevValue.current) {
            setTextValue(value ?? '');
            prevValue.current = value;
        }
    }, [value]);

    useSkipEffectOnMount(() => {
        if (debouncedValue !== prevDebounced.current) {
            // Only call onChange if debouncedVAlue has been updated to avoid unwanted overwrites
            prevDebounced.current = debouncedValue;
            handleChange(debouncedValue);
        }
    }, [debouncedValue, handleChange, prevValue.current, handleChange]);

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
            onFocus={
                touchOnFocus
                    ? () => form.setFieldTouched(field.name, true)
                    : undefined
            }
            onBlur={touchOnFocus ? field.onBlur : undefined}
            onChange={e => {
                setTextValue(e.target.value);
            }}
            value={textValue}
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
    debounceTime: 500,
};

TextInput.propTypes = {
    field: PropTypes.object,
    form: PropTypes.object,
    value: PropTypes.any,
    touchOnFocus: PropTypes.bool,
    debounceTime: PropTypes.number,
};
