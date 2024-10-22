import { get } from 'lodash';
import React, { FunctionComponent } from 'react';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { DropdownOptions } from '../../../../../../hat/assets/js/apps/Iaso/types/utils';

export type Option = DropdownOptions<string | number>;
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
    returnFullObject?: boolean;
};

export const MultiSelect: FunctionComponent<Props> = ({
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
    returnFullObject = false,
}) => {
    const hasError =
        form.errors &&
        Boolean(get(form.errors, field.name) && get(form.touched, field.name));
    return (
        <InputComponent
            keyValue={field.name}
            type="select"
            withMarginTop={withMarginTop}
            value={field.value}
            multi
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
            errors={hasError ? [get(form.errors, field.name)] : []}
            returnFullObject={returnFullObject}
        />
    );
};
