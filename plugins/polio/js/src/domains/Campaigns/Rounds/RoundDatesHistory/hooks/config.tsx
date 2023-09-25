import React, { useMemo } from 'react';
import { Column, textPlaceholder, useSafeIntl } from 'bluesquare-components';
import { DateCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import getDisplayName from '../../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import MESSAGES from '../../../../../constants/messages';

export const useGetRoundDatesHistoryColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.dateOfChange),
                accessor: 'created_at',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.previousStartDate),
                accessor: 'previous_started_at',
                sortable: false,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.previousEndDate),
                accessor: 'previous_ended_at',
                sortable: false,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.startDate),
                accessor: 'started_at',
                sortable: false,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.endDate),
                accessor: 'ended_at',
                sortable: false,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.reasonForDateChange),
                accessor: 'reason',
                sortable: false,
                Cell: settings => {
                    return (
                        <span>
                            {formatMessage(
                                MESSAGES[settings.row.original.reason],
                            )}
                        </span>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.modifiedBy),
                accessor: 'modified_by',
                sortable: true,
                Cell: settings => {
                    const username = settings.row.original.modified_by
                        ? getDisplayName(settings.row.original.modified_by)
                        : textPlaceholder;
                    return <span>{username}</span>;
                },
            },
        ];
    }, [formatMessage]);
};
