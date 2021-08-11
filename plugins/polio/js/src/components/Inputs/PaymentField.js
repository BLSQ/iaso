import React from 'react';
import { Select } from './Select';

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

export const PaymentField = props => (
    <Select label="Payment Mode" options={PAYMENT} {...props} />
);
