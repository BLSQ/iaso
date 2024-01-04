import React, { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { DateCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import MESSAGES from '../../messages';
import { USABLE_VIALS } from '../../constants';
import { NumberCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/NumberCell';

export const useVaccineStockManagementDetailsColumns = (tab): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const columns = [
            {
                Header: formatMessage(MESSAGES.date),
                accessor: 'date',
                id: 'date',
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.action),
                accessor: 'action',
                id: 'action',
            },
            {
                Header: formatMessage(MESSAGES.vials_in),
                accessor: 'vials_in',
                Cell: settings => (
                    <NumberCell value={settings.row.original.vials_in} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.doses_in),
                accessor: 'doses_in',
                Cell: settings => (
                    <NumberCell value={settings.row.original.doses_in} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.vials_out),
                accessor: 'vials_out',
                Cell: settings => (
                    <NumberCell value={settings.row.original.vials_out} />
                ),
            },
            {
                Header: formatMessage(MESSAGES.doses_out),
                accessor: 'doses_out',
                Cell: settings => (
                    <NumberCell value={settings.row.original.doses_out} />
                ),
            },
        ];
        if (tab === USABLE_VIALS) {
            return columns;
        }
        return columns.filter(col => !col.accessor.includes('doses'));
    }, [formatMessage, tab]);
};
