import React from 'react';
import PropTypes from 'prop-types';
import InputComponent from '../../../../components/forms/InputComponent';

const EditableTextFields = ({ fields }) => {
    return fields.map(field => (
        <InputComponent
            key={field.keyValue}
            clearable={false}
            type={field.password ? 'password' : 'text'}
            keyValue={field.keyValue}
            label={field.label}
            value={field.value}
            onChange={(_, value) => {
                field.onChange(value);
            }}
        />
    ));
};

EditableTextFields.proptypes = {
    fields: PropTypes.array.isRequired,
};

export { EditableTextFields };
