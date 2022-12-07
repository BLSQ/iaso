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

type Props = {
    field: any;
    form: any;
    label: string;
    required: boolean;
    debounceTime?: number;
    withMarginTop?: boolean;
    clearable?: boolean;
    // touchOnFocus?: boolean;
};

export const DebouncedTextInput: FunctionComponent<Props> = ({
    field,
    form,
    label,
    required,
    debounceTime = 0,
    withMarginTop = false,
    clearable = false,
    // touchOnFocus = true,
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
        Boolean(get(form.errors, field.name) && get(touched, field.name));
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
    const prevValue = useRef();
    const prevDebounced = useRef();
    const [textValue, setTextValue] = useState(field.value ?? '');
    const [debouncedValue] = useDebounce(textValue, debounceTime);

    // const handleChangeAndFocus = useCallback(
    //     e => {
    //         form?.setFieldTouched(field.name, true);
    //         field?.onChange(e);
    //     },
    //     [form, field],
    // );

    // const handleChange = useMemo(
    //     () => (touchOnFocus ? field.onChange : handleChangeAndFocus),
    //     [field.onChange, handleChangeAndFocus, touchOnFocus],
    // );

    // Reset state when value changes to prevent wrongly persisting the state value
    useEffect(() => {
        if (field.value !== prevValue.current) {
            setTextValue(field.value ?? '');
            prevValue.current = field.value;
        }
    }, [field.value]);

    useSkipEffectOnMount(() => {
        if (debouncedValue !== prevDebounced.current) {
            // Only call onChange if debouncedVAlue has been updated to avoid unwanted overwrites
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
