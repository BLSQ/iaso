import React from 'react';
import PropTypes from 'prop-types';
import InputComponent from './InputComponent';

const UneditableFields = ({ fields }) => {
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

UneditableFields.propTypes = {
    fields: PropTypes.array.isRequired,
};

export { UneditableFields };
