import React, { FunctionComponent } from 'react';
import { IntlMessage } from 'bluesquare-components';
import InputComponent from './InputComponent';

type Props = {
    fields: {
        keyValue: string;
        password?: boolean;
        label: IntlMessage;
        value: any;
        errors?: any[];
        onChange: (key: string, bvalue: any) => void;
    }[];
};

export const EditableTextFields: FunctionComponent<Props> = ({ fields }) => {
    return fields.map(field => (
        <InputComponent
            key={field.keyValue}
            clearable={false}
            type={field.password ? 'password' : 'text'}
            keyValue={field.keyValue}
            label={field.label}
            value={field.value}
            errors={field.errors ? field.errors : []}
            onChange={(key, value) => field.onChange(key, value)}
        />
    ));
};
