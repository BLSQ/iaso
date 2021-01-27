import React from 'react';
import Chip from '@material-ui/core/Chip';
import { displayDateFromTimestamp } from '../../utils/intlUtil';
import MESSAGES from './messages';

const tasksTableColumns = (formatMessage, component) => [
    {
        Header: formatMessage(MESSAGES.status),
        accessor: 'status',
        Cell: settings => {
            const statusCode =
                MESSAGES[settings.original.status.toLowerCase()] !== undefined
                    ? settings.original.status
                    : 'UNKNOWN';

            return (
                <span>
                    {settings.original.name}
                    <br />
                    <Chip
                        variant="outlined"
                        color="primary"
                        size="small"
                        label={formatMessage(
                            MESSAGES[statusCode.toLowerCase()],
                        )}
                    />
                </span>
            );
        },
    },
    {
        Header: formatMessage(MESSAGES.progress),
        accessor: 'progress',
        Cell: settings => (
            <span>
                {settings.original.status === 'RUNNING'
                    ? `${settings.original.progress_value}/${
                          settings.original.end_value
                      } ${formatMessage(MESSAGES.progressLabel)}`
                    : '-'}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.message),
        accessor: 'message',
        Cell: settings => (
            <span>
                {settings.original.status === 'RUNNING'
                    ? settings.original.progress_message
                    : '-'}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.timeCreated),
        accessor: 'created_at',
        Cell: settings => (
            <span>
                {settings.original.started_at === null
                    ? '-'
                    : displayDateFromTimestamp(settings.original.created_at)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.timeStart),
        accessor: 'started_at',
        Cell: settings => (
            <span>
                {settings.original.status === 'QUEUED' ||
                settings.original.started_at === null
                    ? '-'
                    : displayDateFromTimestamp(settings.original.started_at)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.timeEnd),
        accessor: 'ended_at',
        Cell: settings => (
            <span>
                {settings.original.status === 'RUNNING' ||
                settings.original.status === 'QUEUED' ||
                settings.original.ended_at === null
                    ? '-'
                    : displayDateFromTimestamp(settings.original.ended_at)}
            </span>
        ),
    },
];
export default tasksTableColumns;
