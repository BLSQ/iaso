import { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';
import { ChronogramTaskMetaData } from '../../types';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';

export const useChronogramTableColumns = (
    chronogramTaskMetaData: ChronogramTaskMetaData,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.labelId),
                id: 'id',
                accessor: 'id',
            },
            {
                Header: formatMessage(MESSAGES.labelCampaignObrName),
                id: 'round__campaign__obr_name',
                accessor: 'campaign_obr_name',
            },
            {
                Header: formatMessage(MESSAGES.labelRoundNumber),
                id: 'round__number',
                accessor: 'round_number',
            },
            {
                Header: formatMessage(MESSAGES.labelRoundStartDate),
                id: 'round__started_at',
                accessor: 'round_start_date',
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.labelIsOnTime),
                id: 'is_on_time',
                accessor: 'is_on_time',
                Cell: settings =>
                    settings.row.original.is_on_time
                        ? formatMessage(MESSAGES.yes)
                        : formatMessage(MESSAGES.no),
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.labelPercentageOfCompletion),
                id: 'percentage_of_completion',
                accessor: 'percentage_of_completion',
                Cell: settings =>
                    Object.values(
                        settings.row.original.percentage_of_completion,
                    )
                        .map(i => i + '%')
                        .join(' / '),
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.labelNumTaskDelayed),
                id: 'num_task_delayed',
                accessor: 'num_task_delayed',
                sortable: false,
            },
        ];
    }, [formatMessage, chronogramTaskMetaData]);
};
