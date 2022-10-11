// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from './messages';

import { IntlFormatMessage } from '../../types/intl';
import { Column } from '../../types/table';

export const defaultSorted = [{ id: 'performed_at', desc: false }];

export const useGetColumns = (): Array<Column> => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return [
        {
            Header: 'Id',
            accessor: 'storage_id',
            width: 80,
        },
        {
            Header: formatMessage(MESSAGES.type),
            accessor: 'storage_type',
            id: 'storage_type',
        },
        {
            Header: formatMessage(MESSAGES.status),
            accessor: 'storage_status_status',
            id: 'storage_status_status',
        },
        {
            Header: formatMessage(MESSAGES.location),
            accessor: 'org_unit_name',
            id: 'org_unit_name',
        },
        {
            Header: formatMessage(MESSAGES.entity),
            accessor: 'entity_attributes_name',
            id: 'entity_attributes_name',
        },
    ];
};
