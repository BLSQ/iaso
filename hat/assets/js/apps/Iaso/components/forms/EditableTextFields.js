import React from 'react';
import PropTypes from 'prop-types';
import InputComponent from './InputComponent.tsx';

const EditableTextFields = ({ fields }) => {
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

EditableTextFields.proptypes = {
    fields: PropTypes.array.isRequired,
};

export { EditableTextFields };
