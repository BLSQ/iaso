import React from 'react';
import PropTypes from 'prop-types';
import { Checkbox } from '@material-ui/core';
import FormControlLabel from '@material-ui/core/FormControlLabel';

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
