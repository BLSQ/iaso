import { useSafeIntl, Column, IntlFormatMessage } from 'bluesquare-components';

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
            accessor: 'group__name',
            id: 'group__name',
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
