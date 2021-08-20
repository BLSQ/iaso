import React from 'react';
import moment from 'moment';
import {
    ColumnText as ColumnTextComponent,
    displayDateFromTimestamp,
} from 'bluesquare-components';
import MESSAGES from './messages';

const TableColumns = formatMessage => [
    {
        Header: formatMessage(MESSAGES.titleCol),
        accessor: 'title',
        style: { justifyContent: 'left' },
        Cell: settings => (
            <ColumnTextComponent text={settings.cell.row.original.title} />
        ),
    },
    {
        Header: formatMessage(MESSAGES.author),
        accessor: 'auhtor',
        Cell: settings => settings.cell.row.original.author.username,
    },
    {
        Header: formatMessage(MESSAGES.createdAt),
        accessor: 'created_at',
        Cell: settings =>
            moment(settings.cell.row.original.created_at).format(
                'DD/MM/YYYY HH:mm',
            ),
    },
    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        Cell: settings =>
            moment(settings.cell.row.original.updated_at).format(
                'DD/MM/YYYY HH:mm',
            ),
    },
];
export default TableColumns;
