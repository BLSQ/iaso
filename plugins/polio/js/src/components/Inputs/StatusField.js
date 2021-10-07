import React from 'react';
import { useSafeIntl, useTranslatedOptions } from 'bluesquare-components';
import { Select } from './Select';
import MESSAGES from '../../constants/messages';

const statuses = [
    {
        value: 'PENDING',
        label: MESSAGES.pending,
        // label: formatMessage(MESSAGES.pending),
    },
    {
        value: 'ONGOING',
        label: MESSAGES.ongoing,
        // label: formatMessage(MESSAGES.ongoing),
    },
    {
        value: 'FINISHED',
        label: MESSAGES.finished,
        // label: formatMessage(MESSAGES.finished),
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
