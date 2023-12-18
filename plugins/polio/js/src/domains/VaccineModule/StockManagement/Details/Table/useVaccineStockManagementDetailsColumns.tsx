import { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { DateCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import MESSAGES from '../../messages';
import { USABLE_VIALS } from '../../constants';

export const useVaccineStockManagementDetailsColumns = (tab): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        const columns = [
            {
                Header: formatMessage(MESSAGES.date),
                accessor: 'date',
                id: 'date',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.action),
                accessor: 'action',
                id: 'action',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.vials_in),
                accessor: 'vials_in',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.doses_in),
                accessor: 'doses_in',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.vials_out),
                accessor: 'vials_out',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.doses_out),
                accessor: 'doses_out',
                sortable: true,
            },
        ];
        if (tab === USABLE_VIALS) {
            return columns;
        }
        return columns.filter(col => !col.accessor.includes('doses'));
    }, [formatMessage, tab]);
};
