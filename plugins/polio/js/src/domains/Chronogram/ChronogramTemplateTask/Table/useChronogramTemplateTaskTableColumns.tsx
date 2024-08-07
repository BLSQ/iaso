import React, { useMemo } from 'react';
import { Box } from '@mui/material';

import { Column, useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../messages';
import { DeleteChronogramTemplateTask } from '../Modals/ChronogramTemplateTaskDeleteModal';
import { EditChronogramTemplateTaskModal } from '../Modals/ChronogramTemplateTaskCreateEditModal';
import { ChronogramTaskMetaData } from '../../types';

export const useChronogramTemplateTaskTableColumns = (
    chronogramTaskMetaData: ChronogramTaskMetaData,
): Column[] => {
    const { formatMessage } = useSafeIntl();
    // @ts-ignore
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
                accessor: row => row.description || row.description_en,
                sortable: false,
                width: 800,
            },
            {
                Header: formatMessage(MESSAGES.labelStartOffsetInDays),
                id: 'start_offset_in_days',
                accessor: 'start_offset_in_days',
            },
            {
                Header: formatMessage(MESSAGES.actions),
                sortable: false,
                Cell: settings => {
                    return (
                        <Box display="inline-flex">
                            {/* @ts-ignore */}
                            <EditChronogramTemplateTaskModal
                                chronogramTaskMetaData={chronogramTaskMetaData}
                                chronogramTemplateTask={settings.row.original}
                            />
                            {/* @ts-ignore */}
                            <DeleteChronogramTemplateTask
                                chronogramTemplateTask={settings.row.original}
                            />
                        </Box>
                    );
                },
            },
        ];
    }, [formatMessage, chronogramTaskMetaData]);
};
