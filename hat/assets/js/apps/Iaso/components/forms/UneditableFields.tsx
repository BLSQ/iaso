import React, { FunctionComponent } from 'react';
import { IntlMessage } from 'bluesquare-components';
import InputComponent from './InputComponent';

type Props = {
    fields: {
        keyValue: string;
        label: IntlMessage;
        value: any;
        errors: any[];
    }[];
};

export const UneditableFields: FunctionComponent<Props> = ({ fields }) => {
    return fields.map(field => (
        <InputComponent
            key={field.keyValue}
            keyValue={field.keyValue}
            value={field.value}
            label={field.label}
            disabled
            type="text"
            clearable={false}
        />
    ));
};
