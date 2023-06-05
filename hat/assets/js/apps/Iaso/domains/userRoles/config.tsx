import { useSafeIntl } from 'bluesquare-components';

import { IntlFormatMessage } from '../../types/intl';

import { Column } from '../../types/table';

import MESSAGES from './messages';

export const useGetUserRolesColumns = (): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    const columns: Column[] = [
        {
            Header: 'Id',
            accessor: 'id',
            width: 80,
        },
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
            id: 'name',
        },
        {
            Header: formatMessage(MESSAGES.created_at),
            accessor: 'created_at',
            id: 'created_at',
        },
        {
            Header: formatMessage(MESSAGES.updated_at),
            accessor: 'updated_at',
            id: 'updated_at',
        },
    ];
    return columns;
};
