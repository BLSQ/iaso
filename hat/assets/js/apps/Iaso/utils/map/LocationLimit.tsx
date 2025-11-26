import React, { FunctionComponent, useState } from 'react';
import { defineMessages } from 'react-intl';
import { useSafeIntl, NumberInput, IntlMessage } from 'bluesquare-components';

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

type Props = {
    keyValue?: string;
    label?: IntlMessage;
    onChange: (keyValue: string, value: number) => void;
    setHasError?: React.Dispatch<React.SetStateAction<boolean>>;
    value?: any;
};

const LocationLimit: FunctionComponent<Props> = ({
    onChange,
    keyValue = 'mapResults',
    label = MESSAGES.locationLimit,
    value = null,
    setHasError = () => null,
}) => {
    const [errors, setErrors] = useState<string[]>([]);
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

export { LocationLimit };
