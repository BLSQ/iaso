import { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';

export const useChronogramTemplateTaskTableColumns = (): Column[] => {
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
        ];
    }, [formatMessage]);
};
