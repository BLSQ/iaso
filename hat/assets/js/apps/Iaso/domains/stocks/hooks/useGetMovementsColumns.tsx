import React from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { DateCell } from '../../../components/Cells/DateTimeCell';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';

export const useGetMovementsColumns = (): Array<Column> => {
    const { formatMessage } = useSafeIntl();
    return [
        {
            Header: formatMessage(MESSAGES.org_unit),
            id: 'org_unit__name',
            accessor: 'org_unit__name',
            Cell: settings => (
                <LinkToOrgUnit orgUnit={settings.row.original.org_unit} />
            ),
        },
        {
            Header: formatMessage(MESSAGES.stockItem),
            id: 'stock_item__name',
            accessor: 'stock_item__name',
            Cell: settings => <>{settings.row.original.stock_item.name}</>,
        },
        {
            Header: formatMessage(MESSAGES.quantity),
            id: 'quantity',
            accessor: 'quantity',
        },
        {
            Header: formatMessage(MESSAGES.created_at),
            id: 'creation_date',
            accessor: 'creation_date',
            Cell: DateCell,
        },
    ];
};
