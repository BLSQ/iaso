import React, { useState } from 'react';

import { KeyboardDatePicker } from '@material-ui/pickers';
import Clear from '@material-ui/icons/Clear';
import {
    FormControl,
    Tooltip,
    IconButton,
    makeStyles,
} from '@material-ui/core';
import PropTypes from 'prop-types';

import { useSafeIntl, commonStyles } from 'bluesquare-components';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    formControl: {
        width: '100%',
    },
    clearDateButton: {
        marginRight: theme.spacing(2),
        padding: 0,
        position: 'absolute',
        right: theme.spacing(6),
        top: 15,
    },
}));

const DatePickerComponent = ({
    placeholder,
    onChange,
    currentDate,
    hasError,
}) => {
    const classes = useStyles();
    const intl = useSafeIntl();
    const [dateError, setDateError] = useState(null);
    return (
        <FormControl className={classes.formControl}>
            <KeyboardDatePicker
                autoOk
                disableToolbar
                inputVariant="outlined"
                InputLabelProps={{
                    className: classes.label,
                    shrink: Boolean(currentDate),
                    error: hasError || Boolean(dateError),
                }}
                InputProps={{
                    error: hasError || Boolean(dateError),
                }}
                format="DD/MM/YYYY" // This one need be set by user locale
                label={placeholder}
                helperText=""
                value={currentDate}
                onChange={onChange}
                onError={error => setDateError(error)}
            />
            {currentDate && (
                <Tooltip arrow title={intl.formatMessage(MESSAGES.clear)}>
                    <IconButton
                        color="inherit"
                        onClick={() => onChange(null)}
                        className={classes.clearDateButton}
                    >
                        <Clear color="primary" />
                    </IconButton>
                </Tooltip>
            )}
        </FormControl>
    );
};

DatePickerComponent.defaultProps = {
    currentDate: null,
};

DatePickerComponent.propTypes = {
    placeholder: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    currentDate: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    hasError: PropTypes.bool.isRequired,
};

export default DatePickerComponent;
