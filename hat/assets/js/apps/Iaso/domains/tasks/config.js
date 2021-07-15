import React from 'react';
import {
    IconButton as IconButtonComponent,
    displayDateFromTimestamp,
} from 'bluesquare-components';
import MESSAGES from './messages';

function getStatusMessageKey(settings) {
    // Return default message key if not in message
    return MESSAGES[settings.original.status.toLowerCase()] !== undefined
      ? settings.original.status.toLowerCase()
      : "unknown";
}

const tasksTableColumns = (formatMessage, killTaskAction) => [
    {
        Header: formatMessage(MESSAGES.name),
        sortable: true,
        accessor: 'name',
        Cell: settings => settings.original.name,
    },
    {
        Header: formatMessage(MESSAGES.launcher),
        sortable: true,
        accessor: 'launcher',
        Cell: settings => settings.original.launcher?.username,
    },
    {
        Header: formatMessage(MESSAGES.progress),
        sortable: true,
        accessor: 'status',
        Cell: settings => {
            return <span>
                {settings.original.status === "RUNNING" &&
                settings.original.end_value > 0
                  ? `${settings.original.progress_value}/${
                    settings.original.end_value
                  } (${Math.round(
                    (settings.original.progress_value /
                      settings.original.end_value) *
                    100
                  )}%)`
                  : formatMessage(
                    MESSAGES[getStatusMessageKey(settings)]
                  )}
            </span>;

        },
    },
    {
        Header: formatMessage(MESSAGES.message),
        sortable: false,
        accessor: 'message',
        Cell: settings => (
            <>
                {settings.original.progress_message}
            </>
        ),
    },

    {
        Header: formatMessage(MESSAGES.timeCreated),
        sortable: true,
        accessor: 'created_at',
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(settings.original.created_at)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.timeStart),
        sortable: true,
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
        sortable: true,
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
    {
        Header: formatMessage(MESSAGES.actions),
        resizable: false,
        sortable: false,
        width: 150,
        Cell: settings => {
            return (
                <section>
                    {['QUEUED', 'RUNNING', 'UNKNOWN'].includes(
                        settings.original.status,
                    ) === true &&
                        settings.original.should_be_killed === false && (
                            <IconButtonComponent
                                onClick={() =>
                                    killTaskAction({
                                        id: settings.original.id,
                                        should_be_killed: true,
                                    })
                                }
                                icon="stop"
                                tooltipMessage={MESSAGES.killTask}
                            />
                        )}
                    {settings.original.should_be_killed === true &&
                        settings.original.status === 'RUNNING' &&
                        formatMessage(MESSAGES.killSignalSent)}
                </section>
            );
        },
    },
];
export default tasksTableColumns;
