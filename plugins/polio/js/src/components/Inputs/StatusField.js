import React from 'react';
import { Select } from './Select';

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
    return <Select label="Status" options={statuses} {...props} />;
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
