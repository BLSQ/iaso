import React, { useMemo } from 'react';
import { Chip } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import {
    IconButton,
    displayDateFromTimestamp,
    Expander,
    Column,
    useSafeIntl,
} from 'bluesquare-components';
import { UseMutateAsyncFunction } from 'react-query';
import MESSAGES from './messages';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';
import { NotificationImportDetailModal } from './components/NotificationImportDetailModal';
import { SxStyles } from '../../types/general';
import { getDisplayName } from '../../utils/usersUtils';

const getTranslatedStatusMessage = (formatMessage, status) => {
    // Return untranslated status if not translation available
    return MESSAGES[status.toLowerCase()]
        ? formatMessage(MESSAGES[status.toLowerCase()])
        : status;
};

const getStatusColor = status => {
    if (['QUEUED', 'RUNNING'].includes(status)) {
        return 'info';
    }
    if (['EXPORTED', 'SUCCESS'].includes(status)) {
        return 'success';
    }
    if (status === 'ERRORED') {
        return 'error';
    }
    return 'warning';
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

type TaskColumn = Partial<Column> & { expander?: boolean; Expander?: any };

export const useTasksTableColumns = (
    killTaskAction: UseMutateAsyncFunction<any, any, any, any>,
    relaunchTaskAction: UseMutateAsyncFunction<any, any, any, any>,
    hasPolioNotificationsPerm: boolean,
): TaskColumn[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
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
                width: 400,
                accessor: 'progress_message',
                Cell: settings => {
                    if (!settings.value) return null;
                    return settings.value?.length < 60
                        ? settings.value
                        : `${settings.value.slice(0, 60)}...`;
                },
            },
            {
                Header: formatMessage(MESSAGES.user),
                sortable: true,
                accessor: 'created_by__username',
                Cell: settings => {
                    const created_by_id = settings.row.original?.created_by?.id;
                    const launcher_id = settings.row.original?.launcher?.id;

                    let created_by: string;
                    if (created_by_id) {
                        created_by = getDisplayName(
                            settings.row.original.created_by,
                        );
                    } else {
                        created_by = '--';
                    }

                    if (launcher_id && launcher_id !== created_by_id) {
                        return (
                            <span>
                                {created_by}
                                <br />
                                <small>
                                    {formatMessage(MESSAGES.last_launched_by)}{' '}
                                    {getDisplayName(
                                        settings.row.original.launcher,
                                    )}
                                </small>
                            </span>
                        );
                    } else {
                        return <span>{created_by}</span>;
                    }
                },
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
                            : displayDateFromTimestamp(
                                  settings.row.original.ended_at,
                              )}
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
                            settings.row.original.should_be_killed ===
                                false && (
                                <IconButton
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
                        {settings.row.original.status === 'ERRORED' && (
                            <IconButton
                                onClick={() =>
                                    relaunchTaskAction({
                                        id: settings.row.original.id,
                                    })
                                }
                                overrideIcon={ReplayIcon}
                                tooltipMessage={MESSAGES.relaunch}
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
                                    iconProps={{}}
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
        ],
        [
            formatMessage,
            hasPolioNotificationsPerm,
            killTaskAction,
            relaunchTaskAction,
        ],
    );
};
