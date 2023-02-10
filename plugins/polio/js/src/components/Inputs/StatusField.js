import React from 'react';
import { useSafeIntl, useTranslatedOptions } from 'bluesquare-components';
import { Select } from './Select';
import MESSAGES from '../../constants/messages';
import { RA_STATUSES } from '../../constants/statuses.ts';
import { BUDGET_STATES } from '../../constants/budget.ts';

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

const budgetStatuses = BUDGET_STATES.map(state => ({
    value: state,
    label: MESSAGES[state],
}));

export const BudgetStatusField = props => {
    const { formatMessage } = useSafeIntl();
    const options = useTranslatedOptions(budgetStatuses);

    return (
        <Select
            label={formatMessage(MESSAGES.status)}
            options={options}
            {...props}
        />
    );
};
