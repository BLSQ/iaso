import React, { useMemo } from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import { DateCell } from '../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import DeleteDialog from '../../../../../../../../hat/assets/js/apps/Iaso/components/dialogs/DeleteDialogComponent';
import { Round } from '../../../../constants/types';
import { AgeRangeCell } from '../components/AgeRangeCell';
import { EditSubActivity } from '../components/Modal/CreateEditSubActivity';
import MESSAGES from '../messages';
import { useDeleteSubActivity } from './api/useDeleteSubActivity';

export const useSubActivitiesColumns = (round?: Round): Column[] => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: deleteSubActivity } = useDeleteSubActivity();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.name),
                id: 'name',
                accessor: 'name',
            },
            {
                Header: formatMessage(MESSAGES.ageGroup),
                id: 'age_min',
                accessor: 'age_min',
                Cell: AgeRangeCell,
            },
            {
                Header: formatMessage(MESSAGES.startDate),
                id: 'start_date',
                accessor: 'start_date',
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.endDate),
                id: 'end_date',
                accessor: 'end_date',
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                id: 'scopes',
                accessor: 'scopes',
                Cell: settings => {
                    return (
                        <>
                            <EditSubActivity
                                subActivity={settings.row.original}
                                iconProps={{}}
                                round={round}
                            />
                            <DeleteDialog
                                titleMessage={MESSAGES.deleteSubActivity}
                                onConfirm={() =>
                                    deleteSubActivity(settings.row.original.id)
                                }
                            />
                        </>
                    );
                },
            },
        ];
    }, [deleteSubActivity, formatMessage, round]);
};
