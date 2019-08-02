import React from 'react';
import moment from 'moment';

const managementLogsColumns = formatMessage => ([
    {
        Header: formatMessage({
            defaultMessage: 'Date',
            id: 'main.label.date',
        }),
        accessor: 'created_at',
        Cell: settings => <span>{moment(settings.original.created_at).format('YYYY-MM-DD HH:mm')}</span>,
    },
    {
        Header: formatMessage({
            defaultMessage: 'Utilisateur',
            id: 'main.label.source',
        }),
        accessor: 'user__username',
        Cell: settings => (
            <span>
                {settings.original.user.userName}
            </span>
        ),
    },
    {
        Header: formatMessage({
            defaultMessage: 'Type',
            id: 'main.label.type',
        }),
        accessor: 'content_type',
    },
    {
        Header: formatMessage({
            defaultMessage: 'Source',
            id: 'main.label.source',
        }),
        accessor: 'source',
    },
]
);
export default managementLogsColumns;
