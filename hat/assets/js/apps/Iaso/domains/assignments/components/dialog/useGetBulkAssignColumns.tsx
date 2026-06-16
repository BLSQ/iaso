import { Column } from 'bluesquare-components';
import { AssignmentCell } from '../table/AssignmentCell';

export const useGetBulkAssignColumns = (): Column[] => {
    return [
        {
            Header: 'Name',
            accessor: 'name',
            id: 'name',
        },
        {
            Header: 'Assignment',
            accessor: 'assignment',
            id: 'assignment',
            Cell: AssignmentCell,
        },
    ];
};
