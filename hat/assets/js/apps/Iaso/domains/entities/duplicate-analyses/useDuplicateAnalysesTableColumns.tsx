import React, { useCallback, useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { DateTimeCell } from 'Iaso/components/Cells/DateTimeCell';
import { useStartAnalyse } from '../duplicates/hooks/api/analyzes';
import MESSAGES from '../duplicates/messages';
import { Parameters } from '../duplicates/types';
import { ActionCell } from './ActionCell';
import { StatusCell } from './StatusCell';

export const useDuplicateAnalysesTableColumns = (
    onRelaunchCompleted: () => void,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: startAnalyse } = useStartAnalyse();
    const handleRelaunch = useCallback(
        ({ algorithm, entity_type_id, fields, parameters }) => {
            startAnalyse({
                algorithm: algorithm,
                entity_type_id: entity_type_id,
                fields: fields,
                parameters: Object.entries(
                    parameters as unknown as Parameters,
                ).map(([name, value]) => ({ name, value })),
            }).then(onRelaunchCompleted);
        },
        [startAnalyse, onRelaunchCompleted],
    );

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
                    const original = settings.row.original;
                    return (
                        <ActionCell
                            status={original.status}
                            onRelaunch={() => handleRelaunch(original)}
                            taskId={original.task_id}
                            analysis={original}
                        />
                    );
                },
            },
        ];
        return columns;
    }, [formatMessage, handleRelaunch]);
};
