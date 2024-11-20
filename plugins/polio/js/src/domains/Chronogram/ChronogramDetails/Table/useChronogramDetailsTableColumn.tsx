import React, { useMemo } from 'react';
import { Box } from '@mui/material';

import { Column, useSafeIntl } from 'bluesquare-components';

import {
    DateCell,
    DateTimeCellRfc,
} from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { DisplayIfUserHasPerm } from '../../../../../../../../hat/assets/js/apps/Iaso/components/DisplayIfUserHasPerm';

import MESSAGES from '../messages';
import { ChronogramTaskMetaData } from '../../types';
import { DeleteChronogramTask } from '../Modals/ChronogramTaskDeleteModal';
import { EditChronogramTaskModal } from '../Modals/ChronogramTaskCreateEditModal';
import * as Permission from '../../../../../../../../hat/assets/js/apps/Iaso/utils/permissions';

export const useChronogramDetailsTableColumn = (
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
                Header: formatMessage(MESSAGES.labelStatus),
                id: 'status',
                accessor: 'get_status_display',
            },
            {
                Header: formatMessage(MESSAGES.labelDelayInDays),
                id: 'annotated_delay_in_days',
                accessor: 'delay_in_days',
            },
            {
                Header: formatMessage(MESSAGES.labelDeadlineDate),
                id: 'annotated_deadline_date',
                accessor: 'deadline_date',
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.labelUserInCharge),
                id: 'user_in_charge',
                accessor: 'user_in_charge',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.labelComment),
                id: 'comment',
                accessor: 'comment',
                sortable: false,
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
                        <Box display="inline-flex">
                            {/* @ts-ignore */}
                            <EditChronogramTaskModal
                                chronogramTaskMetaData={chronogramTaskMetaData}
                                chronogramTask={settings.row.original}
                            />
                            <DisplayIfUserHasPerm
                                permissions={[Permission.POLIO_CHRONOGRAM]}
                            >
                                {/* @ts-ignore */}
                                <DeleteChronogramTask
                                    chronogramTask={settings.row.original}
                                />
                            </DisplayIfUserHasPerm>
                        </Box>
                    );
                },
            },
        ];
    }, [formatMessage, chronogramTaskMetaData]);
};
