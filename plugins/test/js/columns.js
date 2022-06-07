import { DateTimeCell } from 'Iaso/components/Cells/DateTimeCell';
import MESSAGES from './messages';

const TableColumns = formatMessage => [
    {
        Header: formatMessage(MESSAGES.titleCol),
        accessor: 'title',
    },
    {
        Header: formatMessage(MESSAGES.author),
        id: 'author',
        accessor: row => row.author.username,
    },
    {
        Header: formatMessage(MESSAGES.createdAt),
        accessor: 'created_at',
        Cell: DateTimeCell,
    },
    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        Cell: DateTimeCell,
    },
];
export default TableColumns;
