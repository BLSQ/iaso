import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { defineMessages } from 'react-intl';

import { useSafeIntl, NumberInput } from 'bluesquare-components';

const MESSAGES = defineMessages({
    locationLimit: {
        id: 'iaso.map.locationLimit',
        defaultMessage: 'Map results limit',
    },
    error: {
        id: 'iaso.map.locationLimit.error',
        defaultMessage: 'Please enter a correct value',
    },
});

const LocationLimit = ({ keyValue, label, onChange, value, setHasError }) => {
    const [errors, setErrors] = useState([]);
    const { formatMessage } = useSafeIntl();
    const handleChange = newValue => {
        const valueAsInt = parseInt(newValue, 10);
        if (!valueAsInt || valueAsInt < 1) {
            setHasError(true);
            setErrors([formatMessage(MESSAGES.error)]);
        } else {
            setHasError(false);
            setErrors([]);
            onChange(keyValue, valueAsInt);
        }
    };
    return (
        <NumberInput
            value={value}
            keyValue={keyValue}
            label={formatMessage(label)}
            errors={errors}
            onChange={handleChange}
        />
    );
};

LocationLimit.defaultProps = {
    keyValue: 'mapResults',
    label: MESSAGES.locationLimit,
    value: null,
    setHasError: () => null,
};

LocationLimit.propTypes = {
    keyValue: PropTypes.string,
    label: PropTypes.shape({
        id: PropTypes.string.isRequired,
        defaultMessage: PropTypes.string,
    }),
    onChange: PropTypes.func.isRequired,
    setHasError: PropTypes.func,
    value: PropTypes.any,
};

export { LocationLimit };
