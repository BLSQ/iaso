import React from 'react';

const usersTableColumns = formatMessage => [
    {
        Header: formatMessage({
            defaultMessage: 'User name',
            id: 'iaso.label.userName',
        }),
        accessor: 'user__username',
        style: { justifyContent: 'left' },
        Cell: settings => <span>{settings.original.user_name}</span>,
    },
    {
        Header: formatMessage({
            defaultMessage: 'First name',
            id: 'iaso.label.firstName',
        }),
        accessor: 'user__first_name',
        Cell: settings => <span>{settings.original.first_name}</span>,
    },
    {
        Header: formatMessage({
            defaultMessage: 'Last name',
            id: 'iaso.label.lastName',
        }),
        accessor: 'user__last_name',
        Cell: settings => <span>{settings.original.last_name}</span>,
    },
];
export default usersTableColumns;
