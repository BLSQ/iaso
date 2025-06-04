import React from 'react';
import { Checkbox } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import PropTypes from 'prop-types';

export const BooleanInput = ({ field = {}, label, disabled = false } = {}) => {
    return (
        <FormControlLabel
            id={`check-box-${field.name}`}
            checked={field.value || false}
            onChange={field.onChange}
            name={field.name}
            control={<Checkbox />}
            label={label}
            value={field.value || false}
            disabled={disabled}
        />
    );
};

BooleanInput.defaultProps = {
    field: {},
    disabled: false,
};

BooleanInput.propTypes = {
    field: PropTypes.object,
    label: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
};
