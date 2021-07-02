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
