import { get } from 'lodash';
import React, {
    FocusEventHandler,
    FunctionComponent,
    useCallback,
    useEffect,
} from 'react';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';

type Props = {
    label: string;
    field: Record<string, any>;
    form: Record<string, any>;
    min?: number;
    max?: number;
    disabled?: boolean;
    required?: boolean;
    withMarginTop?: boolean;
    numberInputOptions?: {
        prefix?: string;
        suffix?: string;
        min?: number;
        max?: number;
        decimalScale?: number;
        decimalSeparator?: '.' | ',';
        thousandSeparator?: '.' | ',';
    };
    onChange?: (value: number) => void;
    onFocus?:
        | FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>
        | undefined;
    onBlur?: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
};

export const NumberInput: FunctionComponent<Props> = ({
    label,
    field,
    form,
    min,
    max,
    onChange,
    onBlur,
    onFocus,
    numberInputOptions = {},
    withMarginTop = false,
    disabled = false,
    required = false,
}) => {
    const hasError =
        form.errors &&
        Boolean(get(form.errors, field.name) && get(form.touched, field.name));

    const handleChange = useCallback(
        (_keyValue, value) => {
            if (onChange) {
                onChange(value);
            } else {
                form.setFieldTouched(field.name, true);
                form.setFieldValue(field.name, value);
            }
        },
        [field.name, form, onChange],
    );
    // Ugly hack top prevent form validation error when initialValues is null and value is undefined
    useEffect(() => {
        if (field.value === undefined) {
            form.setFieldValue(field.name, null);
        }
    }, [form.setFieldValue, field.value]);

    return (
        <InputComponent
            withMarginTop={withMarginTop}
            keyValue={field.name}
            type="number"
            value={field.value}
            labelString={label}
            onChange={handleChange}
            min={min}
            max={max}
            onBlur={onBlur}
            onFocus={onFocus}
            errors={hasError ? [get(form.errors, field.name)] : []}
            disabled={disabled}
            required={required}
            numberInputOptions={{ min, max, ...numberInputOptions }}
        />
    );
};
