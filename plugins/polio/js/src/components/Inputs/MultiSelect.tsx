import React, { FunctionComponent } from 'react';
import InputComponent from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';
import { DropdownOptions } from '../../../../../../hat/assets/js/apps/Iaso/types/utils';

type Props = {
    options: DropdownOptions<number>;
    label: string;
    field: Record<string, any>;
    form: Record<string, any>;
};

export const MultiSelect: FunctionComponent<Props> = ({
    options,
    label,
    field,
    form,
}) => {
    // console.log('field', field);
    // console.log('form', form);
    return (
        <InputComponent
            keyValue={field.name}
            type="select"
            multi
            value={field.value}
            options={options}
            labelString={label}
            onChange={(_keyValue, value) => {
                form.setFieldValue(field.name, value);
            }}
        />
    );
};
