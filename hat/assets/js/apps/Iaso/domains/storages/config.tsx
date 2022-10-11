import MESSAGES from './messages';

import { IntlFormatMessage } from '../../types/intl';
import { Column } from '../../types/table';

export const Columns = (formatMessage: IntlFormatMessage): Column[] => {
    return [
        {
            Header: 'uuid',
            accessor: 'uuid',
            width: 80,
        },
        {
            Header: formatMessage(MESSAGES.type),
            accessor: 'storage_type',
            id: 'storage_type',
        },
    ];
};
