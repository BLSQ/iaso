import React, { FunctionComponent } from 'react';
import InputComponent from './InputComponent';
import { IntlMessage } from 'bluesquare-components';

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
