import React, { useMemo } from 'react';
import { Column, IconButton, useSafeIntl } from 'bluesquare-components';
import { NOPV2_AUTH_DETAILS } from '../../../../constants/routes';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import MESSAGES from '../../../../constants/messages';
import { Nopv2AuthorisationsStatusCell } from './Nopv2AuthorisationsStatusCell';

const baseUrl = NOPV2_AUTH_DETAILS;

export const useNopv2AuthTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.country),
                accessor: 'country.name',
                id: 'country',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.vaccineAuthStartingDate),
                accessor: 'start_date',
                id: 'start_date',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.currentExpirationDate),
                accessor: 'current_expiration_date',
                sortable: true,
                Cell: DateCell,
            },

            {
                Header: formatMessage(MESSAGES.currentAuthorisedQuantity),
                accessor: 'quantity',
                Cell: settings => (
                    <span>
                        {settings.row.original.quantity > 0
                            ? settings.row.original.quantity
                            : '--'}
                    </span>
                ),
            },
            {
                Header: formatMessage(MESSAGES.mostRecentAuthStatus),
                accessor: 'status',
                Cell: settings => {
                    const { status } = settings.row.original;
                    return <Nopv2AuthorisationsStatusCell status={status} />;
                },
            },
            {
                Header: formatMessage(MESSAGES.nextExpirationDate),
                accessor: 'next_expiration_date',
                sortable: true,
                Cell: DateCell,
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
