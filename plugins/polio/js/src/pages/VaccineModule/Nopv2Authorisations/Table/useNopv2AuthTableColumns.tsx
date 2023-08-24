import React, { useMemo } from 'react';
import {
    Column,
    IconButton,
    formatThousand,
    useSafeIntl,
} from 'bluesquare-components';
import { NOPV2_AUTH_DETAILS } from '../../../../constants/routes';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import MESSAGES from '../../../../constants/messages';

const baseUrl = NOPV2_AUTH_DETAILS;

export const useNopv2AuthTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.country),
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
                accessor: 'account',
                sortable: false,
                Cell: settings => {
                    const { name, id } = settings.row.original.country;
                    return (
                        <IconButton
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.seeHistory}
                            url={`${baseUrl}/order/-expiration_date/pageSize/20/page/1/country/${id}/countryName/${name}`}
                        />
                    );
                },
            },
        ];
    }, [formatMessage]);
};
