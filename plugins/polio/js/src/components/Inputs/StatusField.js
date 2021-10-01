import React from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Select } from './Select';
import MESSAGES from '../../constants/messages';

const statuses = [
    {
        value: 'PENDING',
        label: 'Pending',
    },
    {
        value: 'ONGOING',
        label: 'Ongoing',
    },
    {
        value: 'FINISHED',
        label: 'Finished',
    },
];

export const StatusField = props => {
    const { formatMessage } = useSafeIntl();

    return (
        <Select
            label={formatMessage(MESSAGES.status)}
            options={statuses}
            {...props}
        />
    );
};

const RABudgetstatuses = [
    {
        value: 'REVIEWED',
        label: 'Reviewed by RRT',
    },
    {
        value: 'SUBMITTED',
        label: 'Submitted',
    },
    {
        value: 'TO_SUBMIT',
        label: 'To submit',
    },
    {
        value: 'APPROVED',
        label: 'Approved',
    },
];

export const RABudgetStatusField = props => {
    return <Select label="Status" options={RABudgetstatuses} {...props} />;
};
