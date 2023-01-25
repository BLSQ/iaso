import MESSAGES from './messages';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';
import { YesNoCell } from '../../components/Cells/YesNoCell';

const devicesTableColumns = formatMessage => [
    {
        Header: formatMessage(MESSAGES.imei),
        sortable: false,
        accessor: 'imei',
    },
    {
        Header: formatMessage(MESSAGES.test_device),
        sortable: false,
        accessor: 'test_device',
        Cell: YesNoCell,
    },
    {
        Header: formatMessage(MESSAGES.last_owner),
        sortable: false,
        accessor: 'last_owner',
        Cell: settings =>
            settings.value
                ? `${settings.value.first_name} ${settings.value.last_name} ${settings.value.user_name}`
                : null,
    },
    {
        Header: formatMessage(MESSAGES.timeSynched),
        sortable: false,
        accessor: 'synched_at',
        Cell: DateTimeCell,
    },
    {
        Header: formatMessage(MESSAGES.timeCreated),
        sortable: false,
        accessor: 'created_at',
        Cell: DateTimeCell,
    },
    {
        Header: formatMessage(MESSAGES.timeUpdated),
        sortable: false,
        accessor: 'updated_at',
        Cell: DateTimeCell,
    },
];

export default devicesTableColumns;
