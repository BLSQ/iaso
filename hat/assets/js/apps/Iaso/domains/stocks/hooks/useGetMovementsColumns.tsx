import React from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';

export const useGetMovementsColumns = (): Column => {
    const { formatMessage } = useSafeIntl();
    return [
        {
            Header: formatMessage(MESSAGES.org_unit),
            id: 'org_unit',
            accessor: 'org_unit',
            Cell: settings => (
                <LinkToOrgUnit orgUnit={settings.row.original.org_unit} />
            ),
        },
        {
            Header: formatMessage(MESSAGES.stockItem),
            id: 'stock_item',
            accessor: 'stock_item',
            Cell: settings => <>{settings.row.original.stock_item.name}</>,
        },
    ];
};
