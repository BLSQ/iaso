import React, { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { DateTimeCell } from 'Iaso/components/Cells/DateTimeCell';
import MESSAGES from '../duplicates/messages';
import { ActionCell } from './ActionCell';
import { StatusCell } from './StatusCell';

export const useDuplicateAnalysesTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const columns = [
            {
                Header: formatMessage(MESSAGES.created_at),
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.user),
                accessor: 'created_by.username',
                resizable: false,
            },
            {
                Header: formatMessage(MESSAGES.algorithm),
                accessor: 'algorithm',
                resizable: false,
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.status),
                accessor: 'status',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    return <StatusCell status={settings.row.original.status} />;
                },
            },
            {
                Header: formatMessage(MESSAGES.result_message),
                accessor: 'result_message',
                resizable: false,
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    return (
                        <ActionCell
                            analysisId={settings.row.original.id}
                            status={settings.row.original.status}
                        />
                    );
                },
            },
        ];
        return columns;
    }, [formatMessage]);
};
