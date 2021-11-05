import MESSAGES from './messages';
import { DateTimeCell } from 'iaso/components/Cells/DateTimeCell';

const TableColumns = formatMessage => [
    {
        Header: formatMessage(MESSAGES.titleCol),
        accessor: 'title',
        style: { justifyContent: 'left' },
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
