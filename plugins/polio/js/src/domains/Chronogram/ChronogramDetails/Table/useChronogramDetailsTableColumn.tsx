import { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';

export const useChronogramDetailsTableColumn = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.labelId),
                id: 'id',
                accessor: 'id',
            },
            {
                Header: formatMessage(MESSAGES.labelPeriod),
                id: 'period',
                accessor: 'get_period_display',
            },
            {
                Header: formatMessage(MESSAGES.labelDescription),
                id: 'description',
                accessor: 'description',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.labelStartOffsetInDays),
                id: 'start_offset_in_days',
                accessor: 'start_offset_in_days',
            },
            {
                Header: formatMessage(MESSAGES.labelStatus),
                id: 'status',
                accessor: 'get_status_display',
            },
            {
                Header: formatMessage(MESSAGES.labelDelayInDays),
                id: 'delay_in_days',
                accessor: 'delay_in_days',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.labelDeadlineDate),
                id: 'deadline_date',
                accessor: 'deadline_date',
                Cell: DateCell,
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.labelUserInCharge),
                id: 'user_in_charge',
                accessor: 'user_in_charge.full_name',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.labelComment),
                id: 'comment',
                accessor: 'comment',
                sortable: false,
            },
        ];
    }, [formatMessage]);
};
