import React from 'react';
import { displayDateFromTimestamp } from '../../utils/intlUtil';
import MESSAGES from './messages';

const devicesTableColumns = formatMessage => [
    {
        Header: formatMessage(MESSAGES.imei),
        sortable: false,
        accessor: 'imei',

        Cell: settings => {
            return <span>{settings.original.imei}</span>;
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
                        settings.original.test_device
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
                {settings.original.last_owner !== null &&
                    `${settings.original.last_owner.first_name} ${settings.original.last_owner.last_name}`}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.timeSynched),
        sortable: false,
        accessor: 'synched_at',
        Cell: settings => (
            <span>
                {settings.original.synched_at !== null &&
                    displayDateFromTimestamp(settings.original.synched_at)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.timeCreated),
        sortable: false,
        accessor: 'created_at',
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(settings.original.created_at)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.timeUpdated),
        sortable: false,
        accessor: 'updated_at',
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(settings.original.updated_at)}
            </span>
        ),
    },
];

export default devicesTableColumns;
