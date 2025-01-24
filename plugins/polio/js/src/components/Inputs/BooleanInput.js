import { Checkbox } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';
import PropTypes from 'prop-types';
import React from 'react';

export const BooleanInput = ({ field = {}, label } = {}) => {
    return (
        <FormControlLabel
            id={`check-box-${field.name}`}
            checked={field.value || false}
            onChange={field.onChange}
            name={field.name}
            control={<Checkbox />}
            label={label}
            value={field.value || false}
        />
    );
};

BooleanInput.defaultProps = {
    field: {},
};

BooleanInput.propTypes = {
    field: PropTypes.object,
    label: PropTypes.string.isRequired,
};
