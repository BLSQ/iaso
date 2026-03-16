import { useMemo } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { DateCell } from 'Iaso/components/Cells/DateTimeCell';
import { NumberCell } from 'Iaso/components/Cells/NumberCell';
import MESSAGES from '../messages';

export const useWorkflowsTableColumns = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.name),
                id: 'name',
                accessor: 'name',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'createdAt',
                accessor: 'createdAt',
                sortable: true,
                cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'formCount',
                accessor: 'formCount',
                cell: NumberCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_at),
                id: 'updatedAt',
                accessor: 'updatedAt',
                sortable: true,
                cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.created_by),
                id: 'createdBy',
                accessor: 'createdBy',
                sortable: true,
                cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.updated_by),
                id: 'updatedBy',
                accessor: 'updatedBy',
                sortable: true,
                cell: DateCell,
            },
        ];
    }, [formatMessage]);
};
