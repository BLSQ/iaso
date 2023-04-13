import React, { FunctionComponent, useState, useCallback } from 'react';
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
    {
        value: 'MOBILEMONEY',
        label: 'Mobile Money',
    },
];

type Props = {
    responsible: string;
};

export const PaymentField: FunctionComponent<Props> = ({
    responsible,
    field,
    form,
    ...props
}) => {
    const { formatMessage } = useSafeIntl();
    const { name } = field;
    const {
        setFieldValue,
        touched,
        errors: formErrors,
        setFieldTouched,
    } = form;

    const onChange = useCallback(
        value => {
            setFieldTouched(name, true);
            setFieldValue(name, value);
        },
        [name, setFieldTouched, setFieldValue],
    );

    return (
        <Select
            label={
                responsible === 'UNICEF'
                    ? formatMessage(MESSAGES.payment_mode_unicef)
                    : formatMessage(MESSAGES.payment_mode_who)
            }
            options={PAYMENT}
            {...props}
            onChange={onChange}
        />
    );
};
