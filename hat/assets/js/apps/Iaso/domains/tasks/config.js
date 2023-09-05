import React from 'react';
import {
    IconButton as IconButtonComponent,
    displayDateFromTimestamp,
} from 'bluesquare-components';
import MESSAGES from './messages';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';

const getTranslatedStatusMessage = (formatMessage, status) => {
    // Return untranslated status if not translation available
    return MESSAGES[status.toLowerCase()]
        ? formatMessage(MESSAGES[status.toLowerCase()])
        : status;
};

const safePercent = (a, b) => {
    if (b === 0) {
        return '';
    }
    const percent = 100 * (a / b);
    return `${percent.toFixed(2)}%`;
};

const tasksTableColumns = (formatMessage, killTaskAction) => [
    {
        Header: formatMessage(MESSAGES.name),
        sortable: true,
        accessor: 'name',
    },
    {
        Header: formatMessage(MESSAGES.progress),
        sortable: true,
        accessor: 'status',
        Cell: settings => {
            return (
                <span>
                    {settings.value === 'RUNNING' &&
                    settings.row.original.end_value > 0
                        ? `${settings.row.original.progress_value}/${
                              settings.row.original.end_value
                          } (${safePercent(
                              settings.row.original.progress_value,
                              settings.row.original.end_value,
                          )})`
                        : getTranslatedStatusMessage(
                              formatMessage,
                              settings.value,
                          )}
                </span>
            );
        },
    },
    {
        Header: formatMessage(MESSAGES.message),
        sortable: false,
        align: 'left',
        width: 550,
        accessor: 'progress_message',
        Cell: settings => {
            if (!settings.value) return null;
            return settings.value?.length < 40 ? (
                settings.value
            ) : (
                <details>
                    <summary>{settings.value.slice(0, 99)}...</summary>
                    <i>Open for more details</i>
                    <pre style={{ maxWidth: '550px', textWrap: 'wrap' }}>
                        {settings.value}
                    </pre>
                </details>
            );
        },
    },
    {
        Header: formatMessage(MESSAGES.launcher),
        sortable: true,
        accessor: 'launcher',
        Cell: settings => settings.value?.username ?? null,
    },
    {
        Header: formatMessage(MESSAGES.timeCreated),
        sortable: true,
        accessor: 'created_at',
        Cell: DateTimeCell,
    },
    {
        Header: formatMessage(MESSAGES.timeStart),
        sortable: true,
        accessor: 'started_at',
        Cell: settings => (
            <span>
                {settings.row.original.status === 'QUEUED' ||
                settings.row.original.started_at === null
                    ? ''
                    : displayDateFromTimestamp(
                          settings.row.original.started_at,
                      )}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.timeEnd),
        sortable: true,
        accessor: 'ended_at',
        Cell: settings => (
            <span>
                {settings.row.original.status === 'RUNNING' ||
                settings.row.original.status === 'QUEUED' ||
                settings.row.original.ended_at === null
                    ? '-'
                    : displayDateFromTimestamp(settings.row.original.ended_at)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        width: 150,
        Cell: settings => (
            <section>
                {['QUEUED', 'RUNNING', 'UNKNOWN'].includes(
                    settings.row.original.status,
                ) === true &&
                    settings.row.original.should_be_killed === false && (
                        <IconButtonComponent
                            onClick={() =>
                                killTaskAction({
                                    id: settings.row.original.id,
                                    should_be_killed: true,
                                })
                            }
                            icon="stop"
                            tooltipMessage={MESSAGES.killTask}
                        />
                    )}
                {settings.row.original.should_be_killed === true &&
                    settings.row.original.status === 'RUNNING' &&
                    formatMessage(MESSAGES.killSignalSent)}
            </section>
        ),
    },
];
export default tasksTableColumns;
