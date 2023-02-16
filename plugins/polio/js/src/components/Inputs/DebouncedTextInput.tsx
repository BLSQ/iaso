import { get } from 'lodash';
import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import { useDebounce } from 'use-debounce';
// @ts-ignore
import { useSkipEffectOnMount } from 'bluesquare-components';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { isTouched } from '../../utils';

type Props = {
    field: any;
    form: any;
    label: string;
    required: boolean;
    debounceTime?: number;
    withMarginTop?: boolean;
    clearable?: boolean;
};

export const DebouncedTextInput: FunctionComponent<Props> = ({
    field,
    form,
    label,
    required,
    debounceTime = 0,
    withMarginTop = false,
    clearable = false,
}) => {
    const { name } = field;
    const {
        setFieldValue,
        touched,
        errors: formErrors,
        setFieldTouched,
    } = form;
    const hasError =
        form.errors &&
        Boolean(get(form.errors, field.name) && isTouched(touched));
    const errors = useMemo(
        () => (hasError ? [get(formErrors, name)] : []),
        [formErrors, hasError, name],
    );
    const onChange = useCallback(
        value => {
            setFieldTouched(name, true);
            setFieldValue(name, value);
        },
        [name, setFieldTouched, setFieldValue],
    );
    const parsedValue =
        typeof field?.value === 'number'
            ? `${field.value}`
            : field?.value ?? '';
    const prevValue = useRef<string>();
    const prevDebounced = useRef();
    const [textValue, setTextValue] = useState(parsedValue);
    const [debouncedValue] = useDebounce(textValue, debounceTime);

    useEffect(() => {
        prevDebounced.current = parsedValue;
        // leaving the deps empty because the effect should only run once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Reset state when value changes to prevent wrongly persisting the state value
    useEffect(() => {
        if (field.value !== prevValue.current) {
            // using parsedValue to avoid type error
            setTextValue(parsedValue ?? '');
            prevValue.current = field.value;
        }
    }, [field.value, parsedValue]);

    useSkipEffectOnMount(() => {
        if (debouncedValue !== prevDebounced.current) {
            // Only call onChange if debouncedValue has been updated to avoid unwanted overwrites
            prevDebounced.current = debouncedValue;
            onChange(debouncedValue);
        }
    }, [debouncedValue, onChange, prevValue.current]);

    return (
        <InputComponent
            keyValue={field.name}
            type="text"
            withMarginTop={withMarginTop}
            value={textValue}
            clearable={clearable}
            required={required}
            labelString={label}
            onChange={(_keyValue, value) => {
                setTextValue(value);
            }}
            errors={errors}
        />
    );
};
