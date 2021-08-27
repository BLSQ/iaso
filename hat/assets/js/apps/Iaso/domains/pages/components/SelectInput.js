import React from 'react';
import PropTypes from 'prop-types';
import { Select } from 'bluesquare-components';

const SelectInput = ({
    field,
    form,
    label,
    options,
    loading,
    ...props
} = {}) => {
    const value = field.value || [];
    return (
        <Select
            {...props}
            {...field}
            keyValue={field.name}
            label={label}
            required
            loading={loading}
            clearable={false}
            multi
            value={value}
            options={options}
            onChange={newValue => {
                form.setFieldValue(
                    field.name,
                    newValue ? newValue.split(',') : null,
                );
            }}
        />
    );
};

SelectInput.defaultProps = {
    field: {},
    form: {},
    label: '',
    loading: false,
    options: false,
};

SelectInput.propTypes = {
    field: PropTypes.object,
    form: PropTypes.object,
    label: PropTypes.string,
    loading: PropTypes.bool,
    options: PropTypes.array,
};

export default SelectInput;
