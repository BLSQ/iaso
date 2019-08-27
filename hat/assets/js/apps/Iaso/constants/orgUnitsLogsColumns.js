import React from 'react';
import moment from 'moment';


import { Tooltip } from '@material-ui/core';
import AddCircleOutline from '@material-ui/icons/AddCircleOutline';
import RemoveCircleOutline from '@material-ui/icons/RemoveCircleOutline';

const orgUnitsLogsColumns = formatMessage => ([
    {
        Header: 'ID',
        accessor: 'id',
        width: 100,
    },
    {
        Header: formatMessage({
            defaultMessage: 'Date',
            id: 'iaso.label.date',
        }),
        accessor: 'created_at',
        Cell: settings => <span>{moment(settings.original.created_at).format('YYYY-MM-DD HH:mm')}</span>,
    },
    {
        Header: formatMessage({
            defaultMessage: 'User',
            id: 'iaso.label.user',
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
                ? (
                    <RemoveCircleOutline />
                )
                : (
                    <Tooltip title={formatMessage({
                        defaultMessage: 'Details',
                        id: 'iaso.label.details',
                    })}
                    >
                        <AddCircleOutline />
                    </Tooltip>
                )
        ),
    },
]
);

export default orgUnitsLogsColumns;
