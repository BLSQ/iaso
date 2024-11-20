import React, { useMemo } from 'react';
import { IconButton, Column, useSafeIntl } from 'bluesquare-components';

import {
    DateCell,
    DateTimeCellRfc,
} from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { DisplayIfUserHasPerm } from '../../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';
import { baseUrls } from '../../../../constants/urls';

import MESSAGES from '../messages';
import { DeleteChronogram } from '../Modals/DeleteChronogramModal';
import * as Permission from '../../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';

export const useChronogramTableColumns = (): Column[] => {
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
                width: 700,
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
                id: 'annotated_is_on_time',
                accessor: 'is_on_time',
                Cell: settings =>
                    settings.row.original.is_on_time
                        ? formatMessage(MESSAGES.yes)
                        : formatMessage(MESSAGES.no),
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
                id: 'annotated_num_task_delayed',
                Cell: settings =>
                    `${settings.row.original.num_task_delayed}/${settings.row.original.tasks.length}`,
            },
            {
                Header: formatMessage(MESSAGES.updatedAt),
                id: 'updated_at',
                accessor: 'updated_at',
                Cell: DateTimeCellRfc,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                sortable: false,
                Cell: settings => {
                    return (
                        <>
                            <IconButton
                                icon="remove-red-eye"
                                tooltipMessage={MESSAGES.details}
                                size="small"
                                url={`/${baseUrls.chronogramDetails}/chronogram_id/${settings.row.original.id}`}
                            />
                            <DisplayIfUserHasPerm
                                permissions={[Permission.POLIO_CHRONOGRAM]}
                            >
                                {/* @ts-ignore */}
                                <DeleteChronogram
                                    chronogram={settings.row.original}
                                />
                            </DisplayIfUserHasPerm>
                        </>
                    );
                },
            },
        ];
    }, [formatMessage]);
};
