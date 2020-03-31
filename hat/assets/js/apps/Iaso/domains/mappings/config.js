import React from 'react';
import { displayDateFromTimestamp } from '../../utils/intlUtil';

const mappingsTableColumns = formatMessage => ([
    {
        Header: formatMessage({
            defaultMessage: 'Name',
            id: 'iaso.label.name',
        }),
        accessor: 'name',
    },
    {
        Header: formatMessage({
            defaultMessage: 'Updated at',
            id: 'iaso.label.updated_at',
        }),
        accessor: 'updated_at',
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(settings.original.updated_at)}
            </span>
        ),
    },
]
);
export default mappingsTableColumns;
