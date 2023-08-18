import React, { useMemo } from 'react';
import { formatThousand, useSafeIntl } from 'bluesquare-components';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import MESSAGES from '../../../../constants/messages';

export const useNopv2AuthTableColumns = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.country),
                // id: 'country__name',
                accessor: 'country.name',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.expirationDate),
                accessor: 'expiration_date',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.quantity),
                accessor: 'quantity',
                Cell: settings => (
                    <span>
                        {formatThousand(settings.row.original.quantity)}
                    </span>
                ),
            },
            {
                Header: formatMessage(MESSAGES.status),
                accessor: 'status',
                Cell: settings => (
                    <span
                        style={
                            settings.row.original.status === 'expired'
                                ? { color: 'red' }
                                : undefined
                        }
                    >
                        {formatMessage(
                            MESSAGES[settings.row.original.status],
                        ).toUpperCase()}
                    </span>
                ),
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'none',
                Cell: settings => (
                    <span>{settings.row.original.country.id}</span>
                ),
            },
        ];
    }, [formatMessage]);
};
