import { get } from 'lodash';
import React, { FunctionComponent, useMemo } from 'react';
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
    renderTags?: (tagValue: Array<any>, getTagProps: any) => Array<any>;
    freeSolo?: boolean;
};

export const Select: FunctionComponent<Props> = ({
    options,
    label,
    field,
    form,
    onChange,
    renderTags,
    disabled = false,
    clearable = true,
    withMarginTop = false,
    required = false,
    freeSolo = false,
}) => {
    const hasError =
        form.errors &&
        Boolean(get(form.errors, field.name) && get(form.touched, field.name));
    const errors = useMemo(
        () => [get(form.errors, field.name)],
        [field.name, form.errors],
    );

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
            renderTags={renderTags}
            onChange={(keyValue, value) => {
                if (onChange) {
                    onChange(keyValue, value);
                } else {
                    form.setFieldTouched(field.name, true);
                    form.setFieldValue(field.name, value);
                }
            }}
            errors={hasError ? errors : []}
            freeSolo={freeSolo}
        />
    );
};
