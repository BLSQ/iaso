import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Select } from './Select';
import MESSAGES from '../../constants/messages';

const PAYMENT = [
    {
        value: 'DIRECT',
        label: 'Direct',
    },
    {
        value: 'DFC',
        label: 'DFC',
    },
];

export const PaymentField = props => {
    const { formatMessage } = useSafeIntl();
    return (
        <Select
            label={formatMessage(MESSAGES.paymentMode)}
            options={PAYMENT}
            {...props}
        />
    );
};
