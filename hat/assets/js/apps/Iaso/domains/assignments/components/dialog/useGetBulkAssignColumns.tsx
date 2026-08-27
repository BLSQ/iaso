import { Column } from 'bluesquare-components';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { AssignmentCell } from '../table/AssignmentCell';

export const useGetBulkAssignColumns = (
    hasMultipleTargets: boolean,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    const columns: Column[] = [
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
            id: 'name',
        },
        {
            Header: formatMessage(MESSAGES.assignment),
            accessor: 'assignment',
            id: 'assignment',
            sortable: false,
            Cell: AssignmentCell,
        },
    ];
    if (hasMultipleTargets) {
        columns.splice(1, 0, {
            Header: formatMessage(MESSAGES.orgUnitType),
            accessor: 'org_unit_type__name',
            id: 'org_unit_type__name',
            Cell: ({ row }) => row.original.org_unit_type?.name ?? '',
        });
    }
    return columns;
};
