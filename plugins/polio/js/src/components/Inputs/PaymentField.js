import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../constants/messages';
import { Select } from './Select';

export const PaymentField = props => {
    const { formatMessage } = useSafeIntl();
    const PAYMENT = [
        {
            value: 'DIRECT',
            label: 'Direct',
        },
        {
            value: 'DFC',
            label: 'DFC',
        },
        {
            value: 'MOBILE_PAYMENT',
            label: formatMessage(MESSAGES.mobilePayment),
        },
    ];
    return (
        <Select
            label={formatMessage(MESSAGES.paymentMode)}
            options={PAYMENT}
            {...props}
        />
    );
};
