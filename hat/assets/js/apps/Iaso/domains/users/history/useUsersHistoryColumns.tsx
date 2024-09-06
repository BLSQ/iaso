import React, { IconButton, useSafeIntl } from 'bluesquare-components';
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
                sortable: false,
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
                sortable: false,
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
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.modifiedBy),
                id: 'modified_by',
                accessor: 'modified_by',
                Cell: settings => {
                    return getDisplayName(settings.row.original.modified_by);
                },
            },
            {
                Header: formatMessage(MESSAGES.actions),
                id: 'action',
                accessor: 'action',
                sortable: false,
                Cell: settings => {
                    return (
                        <IconButton
                            icon="remove-red-eye"
                            url={`/${baseUrls.orgUnitsChangeRequest}/userIds/${settings.row.original.user.id}/potentialPaymentIds/${settings.row.original.id}`}
                            tooltipMessage={
                                MESSAGES.viewChangeRequestsForPotentialPayment // change text to payment lot
                            }
                        />
                    );
                },
            },
        ];
    }, [formatMessage]);
};
