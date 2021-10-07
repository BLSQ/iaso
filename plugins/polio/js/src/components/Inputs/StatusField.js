import React from 'react';
import { useSafeIntl, useTranslatedOptions } from 'bluesquare-components';
import { Select } from './Select';
import MESSAGES from '../../constants/messages';

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

const RABudgetstatuses = [
    {
        value: 'REVIEWED',
        label: MESSAGES.reviewedByRrt,
    },
    {
        value: 'SUBMITTED',
        label: MESSAGES.submitted,
    },
    {
        value: 'TO_SUBMIT',
        label: MESSAGES.toSubmit,
    },
    {
        value: 'APPROVED',
        label: MESSAGES.approved,
    },
];

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
