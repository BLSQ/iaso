import React from 'react';
import { Chip } from '@mui/material';
import {
    IconButton as IconButtonComponent,
    displayDateFromTimestamp,
    Expander,
} from 'bluesquare-components';
import MESSAGES from './messages';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';
import { NotificationImportDetailModal } from './components/NotificationImportDetailModal';

const getTranslatedStatusMessage = (formatMessage, status) => {
    // Return untranslated status if not translation available
    return MESSAGES[status.toLowerCase()]
        ? formatMessage(MESSAGES[status.toLowerCase()])
        : status;
};

const getStatusColor = status => {
    if (['QUEUED', 'RUNNING'].includes(status)) {
        return 'info';
    } else if (['EXPORTED', 'SUCCESS'].includes(status)) {
        return 'success';
    } else if (status === 'ERRORED') {
        return 'error';
    } else {
        return 'warning';
    }
};

const safePercent = (a, b) => {
    if (b === 0) {
        return '';
    }
    const percent = 100 * (a / b);
    return `${percent.toFixed(2)}%`;
};

const styles: SxStyles = {
    chip: {
        color: 'white',
    },
};

const tasksTableColumns = (
    formatMessage,
    killTaskAction,
    hasPolioNotificationsPerm,
) => [
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
                    settings.row.original.end_value > 0 ? (
                        `${settings.row.original.progress_value}/${
                            settings.row.original.end_value
                        } (${safePercent(
                            settings.row.original.progress_value,
                            settings.row.original.end_value,
                        )})`
                    ) : (
                        <Chip
                            label={getTranslatedStatusMessage(
                                formatMessage,
                                settings.value,
                            )}
                            color={getStatusColor(settings.value)}
                            size="small"
                            sx={styles.chip}
                        />
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
            return settings.value?.length < 40
                ? settings.value
                : `${settings.value.slice(0, 40)}...`;
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
                {hasPolioNotificationsPerm &&
                    ['SUCCESS', 'ERRORED'].includes(
                        settings.row.original.status,
                    ) &&
                    settings.row.original.name ===
                        'create_polio_notifications_async' && (
                        <NotificationImportDetailModal
                            task={settings.row.original}
                        />
                    )}
            </section>
        ),
    },
    {
        expander: true,
        accessor: 'expander',
        width: 65,
        Expander,
    },
];
export default tasksTableColumns;
