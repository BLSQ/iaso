import React from 'react';
import PropTypes from 'prop-types';
import {
    FormControlLabel,
    FormControl,
    FormLabel,
    RadioGroup,
    Radio,
} from '@mui/material';
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles(() => ({
    radioGroup: {
        flexDirection: 'row',
    },
    label: {
        fontSize: 12,
    },
}));
const RadioInput = ({
    field,
    form,
    label,
    options,
    onChange,
    ...props
} = {}) => {
    const classes = useStyles();
    return (
        <FormControl component="fieldset">
            <FormLabel className={classes.label} component="legend">
                {label}
            </FormLabel>
            <RadioGroup
                classes={{
                    root: classes.radioGroup,
                }}
                name={field.name}
                {...props}
                {...field}
                onChange={e => {
                    if (onChange) {
                        onChange(e.target.value, form);
                    } else {
                        field.onChange(e);
                    }
                }}
                value={field.value !== undefined ? field.value : null}
            >
                {options.map(option => (
                    <FormControlLabel
                        key={option.value}
                        value={option.value !== undefined ? option.value : null}
                        control={<Radio />}
                        label={option.label}
                    />
                ))}
            </RadioGroup>
        </FormControl>
    );
};

RadioInput.defaultProps = {
    field: {},
    form: {},
    label: '',
    options: [],
    onChange: null,
};

RadioInput.propTypes = {
    field: PropTypes.object,
    form: PropTypes.object,
    label: PropTypes.string,
    options: PropTypes.array,
    onChange: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
};

export default RadioInput;
