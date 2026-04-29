import { Column, useSafeIntl } from 'bluesquare-components';
import { AssignmentCell } from '../components/AssignmentCell';
import MESSAGES from '../messages';

export const useGetColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return [
        {
            Header: 'Id',
            accessor: 'id',
            width: 50,
        },
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
        },
        {
            Header: formatMessage(MESSAGES.assignment),
            accessor: 'assignment',
            Cell: AssignmentCell,
        },
    ];
};
