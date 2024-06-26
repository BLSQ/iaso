import { Column, textPlaceholder, useSafeIntl } from 'bluesquare-components';
import React, { useMemo } from 'react';
import { DateCell } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/Cells/DateTimeCell';
import { useLocale } from '../../../../../../../../../hat/assets/js/apps/Iaso/domains/app/contexts/LocaleContext';
import getDisplayName from '../../../../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';
import MESSAGES from '../../../../../constants/messages';

const NAMEFIELD = 'name_';

export const useGetRoundDatesHistoryColumns = (): Column[] => {
    const { locale: activeLocale } = useLocale();
    const reasonName = `${NAMEFIELD}${activeLocale}`;
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
                accessor: 'reason_for_delay',
                sortable: false,
                Cell: settings => {
                    return (
                        <span>
                            {settings.row.original?.reason_for_delay?.[
                                reasonName
                            ] ?? settings.row.original.reason}
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
    }, [formatMessage, reasonName]);
};
