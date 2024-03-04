import { useMemo } from 'react';
import { useSafeIntl, Column, IntlFormatMessage } from 'bluesquare-components';
import MESSAGES from '../messages';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import { UserCell } from '../../../components/Cells/UserCell';
import { Payment } from '../types';

export const usePaymentLotsColumns = (): Column[] => {
    const { formatMessage }: { formatMessage: IntlFormatMessage } =
        useSafeIntl();
    return useMemo(() => {
        const columns: Column[] = [
            {
                Header: formatMessage(MESSAGES.created_at),
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.name),
                id: 'name',
                accessor: 'name',
            },
            {
                Header: formatMessage(MESSAGES.status),
                id: 'status',
                accessor: 'status',
            },
            {
                Header: formatMessage(MESSAGES.created_by),
                id: 'created_by__username',
                accessor: 'created_by',
                Cell: UserCell,
            },
            {
                Header: formatMessage(MESSAGES.changes),
                id: 'change_requests_count',
                accessor: 'payments',
                Cell: ({ value }: { value: Payment[] }): string => {
                    let count = 0;
                    value.forEach((payment: Payment) => {
                        count += payment.change_requests.length;
                    });
                    return `${count}`;
                },
            },
        ];
        return columns;
    }, [formatMessage]);
};
