import { get } from 'lodash';
import React, { FunctionComponent } from 'react';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { DropdownOptions } from '../../../../../../hat/assets/js/apps/Iaso/types/utils';
import { isTouched } from '../../utils';

type Props = {
    options: DropdownOptions<number>;
    label: string;
    field: Record<string, any>;
    form: Record<string, any>;
    withMarginTop?: boolean;
    clearable?: boolean;
    required?: boolean;
};

export const MultiSelect: FunctionComponent<Props> = ({
    options,
    label,
    field,
    form,
    clearable = true,
    withMarginTop = false,
    required = false,
}) => {
    const hasError =
        form.errors &&
        Boolean(get(form.errors, field.name) && isTouched(form.touched));
    return (
        <InputComponent
            keyValue={field.name}
            type="select"
            withMarginTop={withMarginTop}
            value={field.value}
            multi
            options={options}
            clearable={clearable}
            required={required}
            labelString={label}
            onChange={(_keyValue, value) => {
                form.setFieldTouched(field.name, true);
                form.setFieldValue(field.name, value);
            }}
            errors={hasError ? [get(form.errors, field.name)] : []}
        />
    );
};
