import moment from 'moment';
import MESSAGES from './messages';

const TableColumns = formatMessage => [
    {
        Header: formatMessage(MESSAGES.titleCol),
        accessor: 'title',
        style: { justifyContent: 'left' },
        Cell: settings => settings.row.original.title,
    },
    {
        Header: formatMessage(MESSAGES.author),
        accessor: 'auhtor',
        Cell: settings => settings.row.original.author.username,
    },
    {
        Header: formatMessage(MESSAGES.createdAt),
        accessor: 'created_at',
        Cell: settings =>
            moment(settings.row.original.created_at).format('DD/MM/YYYY HH:mm'),
    },
    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        Cell: settings =>
            moment(settings.row.original.updated_at).format('DD/MM/YYYY HH:mm'),
    },
];
export default TableColumns;
