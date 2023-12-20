import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from '@mui/material';
import FormControlLabel from '@mui/material/FormControlLabel';

export const BooleanInput = ({ field = {}, label } = {}) => {
    return (
        <FormControlLabel
            checked={field.value}
            onChange={field.onChange}
            name={field.name}
            control={<Checkbox />}
            label={label}
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
