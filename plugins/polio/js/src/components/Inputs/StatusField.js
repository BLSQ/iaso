/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useSafeIntl, useTranslatedOptions } from 'bluesquare-components';
import { Select } from './Select';
import MESSAGES from '../../constants/messages';
import { RA_STATUSES } from '../../constants/statuses.ts';

const statuses = [
    {
        value: 'PENDING',
        label: MESSAGES.pending,
    },
    {
        value: 'ONGOING',
        label: MESSAGES.ongoing,
    },
    {
        value: 'FINISHED',
        label: MESSAGES.finished,
    },
];

export const StatusField = props => {
    const { formatMessage } = useSafeIntl();
    const options = useTranslatedOptions(statuses);

    return (
        <Select
            label={formatMessage(MESSAGES.status)}
            options={options}
            {...props}
        />
    );
};

const RABudgetstatuses = RA_STATUSES.map(state => ({
    value: state,
    label: MESSAGES[state],
}));

export const RABudgetStatusField = props => {
    const { formatMessage } = useSafeIntl();
    const options = useTranslatedOptions(RABudgetstatuses);

    return (
        <Select
            label={formatMessage(MESSAGES.status)}
            options={options}
            {...props}
        />
    );
};
