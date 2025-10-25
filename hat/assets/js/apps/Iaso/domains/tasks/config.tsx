import React, { useMemo } from 'react';
import {
    displayDateFromTimestamp,
    Expander,
    Column,
    useSafeIntl,
} from 'bluesquare-components';
import { DateTimeCell } from 'Iaso/components/Cells/DateTimeCell';
import { TaskActionCell } from 'Iaso/domains/tasks/components/ActionCell';
import { getDisplayName } from 'Iaso/utils/usersUtils';
import { StatusCell } from './components/StatusCell';
import MESSAGES from './messages';

type TaskColumn = Partial<Column> & { expander?: boolean; Expander?: any };

export const useTasksTableColumns = (): TaskColumn[] => {
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
                    return <StatusCell task={settings.row.original} />;
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
                    <TaskActionCell task={settings.row.original} />
                ),
            },
        ],
        [formatMessage],
    );
};
