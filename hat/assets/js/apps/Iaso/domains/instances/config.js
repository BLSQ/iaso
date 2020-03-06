/* globals window */
import React from 'react';
import moment from 'moment';
import Link from '@material-ui/core/Link';

import { getPrettyPeriod } from '../../utils/periodsUtils';

const instancesTableColumns = formatMessage => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Updated at',
                id: 'iaso.instance.updated_at',
            }),
            accessor: 'updated_at',
            Cell: settings => (
                <span>
                    {moment.unix(settings.original.updated_at).format('DD/MM/YYYY HH:mm')}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Created at',
                id: 'iaso.instance.created_at',
            }),
            accessor: 'created_at',
            Cell: settings => (
                <span>
                    {moment.unix(settings.original.created_at).format('DD/MM/YYYY HH:mm')}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Period',
                id: 'iaso.instance.period',
            }),
            accessor: 'period',
            Cell: settings => (
                <span>
                    {settings.original.period
                        ? `${getPrettyPeriod(settings.original.period)}`
                        : '/'}
                </span>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'File',
                id: 'iaso.instance.file',
            }),
            sortable: false,
            accessor: 'file_url',
            Cell: settings => (
                <span>
                    <Link
                        onClick={() => window.open(settings.original.file_url, '_blank')}
                        size="small"
                    >
                        XML
                    </Link>
                </span>
            ),
        },
    ]
);
export default instancesTableColumns;
