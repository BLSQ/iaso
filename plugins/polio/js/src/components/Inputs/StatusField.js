import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Select } from './Select';
import MESSAGES from '../../constants/messages';

const statuses = formatMessage => [
    {
        value: 'PENDING',
        label: formatMessage(MESSAGES.pending),
    },
    {
        value: 'ONGOING',
        label: formatMessage(MESSAGES.ongoing),
    },
    {
        value: 'FINISHED',
        label: formatMessage(MESSAGES.finished),
    },
];

export const StatusField = props => {
    const { formatMessage } = useSafeIntl();

    return (
        <Select
            label={formatMessage(MESSAGES.status)}
            options={statuses(formatMessage)}
            {...props}
        />
    );
};

const RABudgetstatuses = formatMessage => [
    {
        value: 'REVIEWED',
        label: formatMessage(MESSAGES.reviewedByRrt),
    },
    {
        value: 'SUBMITTED',
        label: formatMessage(MESSAGES.submitted),
    },
    {
        value: 'TO_SUBMIT',
        label: formatMessage(MESSAGES.toSubmit),
    },
    {
        value: 'APPROVED',
        label: formatMessage(MESSAGES.approved),
    },
];

export const RABudgetStatusField = props => {
    const { formatMessage } = useSafeIntl();
    return (
        <Select
            label="Status"
            options={RABudgetstatuses(formatMessage)}
            {...props}
        />
    );
};
