import React from 'react';
import Chip from '@material-ui/core/Chip';
import IconButtonComponent from '../../components/buttons/IconButtonComponent';
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
                {settings.original.status === 'RUNNING' &&
                settings.original.end_value > 0
                    ? `${settings.original.progress_value}/${
                          settings.original.end_value
                      } (${Math.round(
                          (settings.original.progress_value /
                              settings.original.end_value) *
                              100,
                      )}%)`
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
                {displayDateFromTimestamp(settings.original.created_at)}
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
                    ) === true && (
                        <IconButtonComponent
                            onClick={() =>
                                component.refreshTask(settings.original.id)
                            }
                            icon="refresh"
                            tooltipMessage={MESSAGES.refresh}
                        />
                    )}
                    {['QUEUED', 'RUNNING', 'UNKNOWN'].includes(
                        settings.original.status,
                    ) === true &&
                        settings.original.should_be_killed === false && (
                            <IconButtonComponent
                                onClick={() =>
                                    component.killTask({
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
