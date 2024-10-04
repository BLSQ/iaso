import { get } from 'lodash';
import React, { FunctionComponent } from 'react';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { DropdownOptions } from '../../../../../../hat/assets/js/apps/Iaso/types/utils';

type Props = {
    options: DropdownOptions<number>[];
    label: string;
    field: Record<string, any>;
    form: Record<string, any>;
    withMarginTop?: boolean;
    clearable?: boolean;
    required?: boolean;
    disabled?: boolean;
    onChange?: (_keyValue: string, value: any) => void;
    dependsOn?: string[];
};

export const DependentSingleSelect: FunctionComponent<Props> = ({
    options,
    label,
    field,
    form,
    onChange,
    dependsOn = [],
    disabled = false,
    clearable = true,
    withMarginTop = false,
    required = false,
}) => {
    const showRelatedFieldError = dependsOn.some(name => {
        return (
            get(form.touched, name) &&
            Boolean(get(form.values, name) || get(form.values, name) === 0)
        );
    });
    const hasError =
        form.errors &&
        Boolean(
            (get(form.errors, field.name) && get(form.touched, field.name)) ||
                showRelatedFieldError,
        );

    const err =
        // checking that field.name has value on top of checking `hasError`, otherwise we send [undefined] i.o []
        // and the field loks like it's in error
        hasError && Boolean(get(form.errors, field.name))
            ? [get(form.errors, field.name)]
            : [];
    return (
        <InputComponent
            keyValue={field.name}
            type="select"
            withMarginTop={withMarginTop}
            value={field.value}
            options={options}
            disabled={disabled}
            clearable={clearable}
            required={required}
            labelString={label}
            onChange={(keyValue, value) => {
                if (onChange) {
                    onChange(keyValue, value);
                } else {
                    form.setFieldTouched(field.name, true);
                    form.setFieldValue(field.name, value);
                }
            }}
            errors={err}
        />
    );
};
