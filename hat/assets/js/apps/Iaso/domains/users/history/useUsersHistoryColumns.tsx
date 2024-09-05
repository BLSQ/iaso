import { useSafeIntl } from 'bluesquare-components';
import { useMemo } from 'react';
import MESSAGES from '../messages';
import { DateCell } from '../../../components/Cells/DateTimeCell';
import getDisplayName from '../../../utils/usersUtils';

export const useUsersHistoryColumns = () => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.userName),
                id: 'user',
                accessor: 'user',
                Cell: settings => {
                    return getDisplayName(settings.row.original.modified_by);
                },
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
                // TODO handle text overflow
                Cell: settings => {
                    // type definition not flexible enough
                    // @ts-ignore
                    return settings.row.original.past_location
                        .map(location => location.name)
                        .join(', ');
                },
            },
            {
                Header: formatMessage(MESSAGES.newLocation),
                id: 'new_location',
                accessor: 'new_location',
                // TODO handle text overflow
                Cell: settings => {
                    // type definition not flexible enough
                    // @ts-ignore
                    return settings.row.original.new_location
                        .map(location => location.name)
                        .join(', ');
                },
            },
            {
                Header: formatMessage(MESSAGES.fieldsModified),
                id: 'fields_modified',
                accessor: 'fields_modified',
            },
            {
                Header: formatMessage(MESSAGES.modifiedBy),
                id: 'modified_by',
                accessor: 'modified_by',
                Cell: settings => {
                    return getDisplayName(settings.row.original.modified_by);
                },
            },
        ];
    }, [formatMessage]);
};
