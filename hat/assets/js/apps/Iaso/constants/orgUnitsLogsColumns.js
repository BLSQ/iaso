import React from 'react';
import moment from 'moment';

import AddCircleOutline from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutline from '@material-ui/icons/RemoveCircleOutline';

const orgUnitsLogsColumns = formatMessage => ([
    {
        Header: 'ID',
        accessor: 'id',
    },
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
            id: 'main.label.user',
        }),
        accessor: 'user__username',
        Cell: settings => (
            <span>
                {settings.original.user.userName}
            </span>
        ),
    },
    {
        expander: true,
        width: 65,
        // eslint-disable-next-line react/prop-types
        Expander: ({ isExpanded }) => (
            isExpanded
                ? <RemoveCircleOutline />
                : <AddCircleOutline />
        ),
    },
]
);

export default orgUnitsLogsColumns;
