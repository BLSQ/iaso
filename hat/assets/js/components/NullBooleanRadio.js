import React from 'react';

import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import {
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@material-ui/core';

const setValue = (value) => {
    switch (value) {
        case '1': {
            return true;
        }
        case '0': {
            return false;
        }
        default:
            return null;
    }
};
const getValue = (value) => {
    switch (value) {
        case true: {
            return 1;
        }
        case false: {
            return 0;
        }
        default:
            return -1;
    }
};

const MESSAGES = {
    unknown: {
        id: 'main.label.unknown',
        defaultMessage: 'Unknown',
    },
    yes: {
        id: 'main.label.yes',
        defaultMessage: 'Yes',
    },
    no: {
        id: 'main.label.no',
        defaultMessage: 'No',
    },
};

export const getNullBolleanMessage = (value) => {
    switch (value) {
        case true: {
            return MESSAGES.yes;
        }
        case false: {
            return MESSAGES.no;
        }
        default:
            return MESSAGES.unknown;
    }
};

const NullBooleanRadio = ({
    keyName,
    value,
    onChange,
    intl: {
        formatMessage,
    },
}) => {
    const handleChange = (event) => {
        const newValue = setValue(event.target.value);
        onChange(newValue);
    };

    return (
        <RadioGroup name={keyName} value={getValue(value)} onChange={event => handleChange(event)} className="custom-null-radio">
            <FormControlLabel
                value={1}
                control={<Radio size="small" disableRipple />}
                label={formatMessage(MESSAGES.yes)}
                className="custom-null-radio"
            />
            <FormControlLabel
                value={0}
                control={<Radio size="small" disableRipple />}
                label={formatMessage(MESSAGES.no)}
                className="custom-null-radio"
            />
            <FormControlLabel
                value={-1}
                control={<Radio size="small" disableRipple />}
                label={formatMessage(MESSAGES.unknown)}
                className="custom-null-radio"
            />
        </RadioGroup>
    );
};

NullBooleanRadio.defaultProps = {
    value: undefined,
};

NullBooleanRadio.propTypes = {
    keyName: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
    onChange: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
};

export default injectIntl(NullBooleanRadio);
