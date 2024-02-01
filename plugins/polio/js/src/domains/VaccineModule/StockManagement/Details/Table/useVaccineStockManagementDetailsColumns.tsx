import { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { DateCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import MESSAGES from '../../messages';
import { NumberCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/NumberCell';

export const useVaccineStockManagementDetailsColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    // @ts-ignore
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
                Cell: NumberCell,
            },
            {
                Header: formatMessage(MESSAGES.doses_in),
                accessor: 'doses_in',
                Cell: NumberCell,
            },
            {
                Header: formatMessage(MESSAGES.vials_out),
                accessor: 'vials_out',
                Cell: NumberCell,
            },
            {
                Header: formatMessage(MESSAGES.doses_out),
                accessor: 'doses_out',
                Cell: NumberCell,
            },
        ];
        return columns;
        // if (tab === USABLE_VIALS) {
        //     return columns;
        // }
        // return columns.filter(col => !col.accessor.includes('doses'));
    }, [formatMessage]);
};
