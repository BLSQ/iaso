import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import MESSAGES from '../messages';
import { DateCell } from '../../../components/Cells/DateTimeCell';

export const useUsersHistoryColumns = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.userName),
                id: 'user__username',
                accessor: 'user.username',
            },
            {
                Header: formatMessage(MESSAGES.dateModified),
                id: 'created_at',
                accessor: 'created_at',
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.pastLocation),
                id: 'past_location',
                accessor: 'past_location',
            },
            {
                Header: formatMessage(MESSAGES.newLocation),
                id: 'new_location',
                accessor: 'new_location',
            },
            {
                Header: formatMessage(MESSAGES.fieldsModified),
                id: 'fields_modified',
                accessor: 'fields_modified',
            },
            {
                Header: formatMessage(MESSAGES.modifiedBy),
                id: 'modified_by_username',
                accessor: 'modified_by.username',
            },
        ];
    }, [formatMessage]);
};
