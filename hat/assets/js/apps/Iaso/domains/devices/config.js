import React from 'react';
import { displayDateFromTimestamp } from 'bluesquare-components';
import MESSAGES from './messages';

const devicesTableColumns = formatMessage => [
    {
        Header: formatMessage(MESSAGES.imei),
        sortable: false,
        accessor: 'imei',

        Cell: settings => {
            return <span>{settings.row.original.imei}</span>;
        },
    },
    {
        Header: formatMessage(MESSAGES.test_device),
        sortable: false,
        accessor: 'test_device',
        Cell: settings => {
            return (
                <span>
                    {formatMessage(
                        settings.row.original.test_device
                            ? MESSAGES.yes
                            : MESSAGES.no,
                    )}
                </span>
            );
        },
    },
    {
        Header: formatMessage(MESSAGES.last_owner),
        sortable: false,
        accessor: 'last_owner',
        Cell: settings => (
            <span>
                {settings.row.original.last_owner !== null &&
                    `${settings.row.original.last_owner.first_name} ${settings.row.original.last_owner.last_name}`}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.timeSynched),
        sortable: false,
        accessor: 'synched_at',
        Cell: settings => (
            <span>
                {settings.row.original.synched_at !== null &&
                    displayDateFromTimestamp(settings.row.original.synched_at)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.timeCreated),
        sortable: false,
        accessor: 'created_at',
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(settings.row.original.created_at)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.timeUpdated),
        sortable: false,
        accessor: 'updated_at',
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(settings.row.original.updated_at)}
            </span>
        ),
    },
];

export default devicesTableColumns;
