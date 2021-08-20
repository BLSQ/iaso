import React from 'react';
import Chip from '@material-ui/core/Chip';
import {
    IconButton as IconButtonComponent,
    displayDateFromTimestamp,
} from 'bluesquare-components';
import MESSAGES from './messages';

const tasksTableColumns = (formatMessage, killTaskAction) => [
    {
        Header: formatMessage(MESSAGES.status),
        sortable: true,
        accessor: 'status',
        Cell: settings => {
            const statusCode =
                MESSAGES[settings.cell.row.original.status.toLowerCase()] !== undefined
                    ? settings.cell.row.original.status
                    : 'UNKNOWN';

            return (
                <span>
                    {settings.cell.row.original.name}
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
        sortable: false,
        accessor: 'progress',
        Cell: settings => (
            <span>
                {settings.cell.row.original.status === 'RUNNING' &&
                settings.cell.row.original.end_value > 0
                    ? `${settings.cell.row.original.progress_value}/${
                          settings.cell.row.original.end_value
                      } (${Math.round(
                          (settings.cell.row.original.progress_value /
                              settings.cell.row.original.end_value) *
                              100,
                      )}%)`
                    : '-'}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.message),
        sortable: false,
        accessor: 'message',
        Cell: settings => (
            <span>
                {settings.cell.row.original.status === 'RUNNING'
                    ? settings.cell.row.original.progress_message
                    : '-'}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.timeCreated),
        sortable: true,
        accessor: 'created_at',
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(settings.cell.row.original.created_at)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.timeStart),
        sortable: true,
        accessor: 'started_at',
        Cell: settings => (
            <span>
                {settings.cell.row.original.status === 'QUEUED' ||
                settings.cell.row.original.started_at === null
                    ? '-'
                    : displayDateFromTimestamp(settings.cell.row.original.started_at)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.timeEnd),
        sortable: true,
        accessor: 'ended_at',
        Cell: settings => (
            <span>
                {settings.cell.row.original.status === 'RUNNING' ||
                settings.cell.row.original.status === 'QUEUED' ||
                settings.cell.row.original.ended_at === null
                    ? '-'
                    : displayDateFromTimestamp(settings.cell.row.original.ended_at)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.actions),
        resizable: false,
        sortable: false,
        width: 150,
        Cell: settings => {
            return (
                <section>
                    {['QUEUED', 'RUNNING', 'UNKNOWN'].includes(
                        settings.cell.row.original.status,
                    ) === true &&
                        settings.cell.row.original.should_be_killed === false && (
                            <IconButtonComponent
                                onClick={() =>
                                    killTaskAction({
                                        id: settings.cell.row.original.id,
                                        should_be_killed: true,
                                    })
                                }
                                icon="stop"
                                tooltipMessage={MESSAGES.killTask}
                            />
                        )}
                    {settings.cell.row.original.should_be_killed === true &&
                        settings.cell.row.original.status === 'RUNNING' &&
                        formatMessage(MESSAGES.killSignalSent)}
                </section>
            );
        },
    },
];
export default tasksTableColumns;
