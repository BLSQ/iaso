import React, { useMemo } from 'react';
import {
    Column,
    IconButton,
    Setting,
    useSafeIntl,
} from 'bluesquare-components';
import { DateCell } from 'Iaso/components/Cells/DateTimeCell';
import { baseUrls } from 'Iaso/constants/urls';
import MESSAGES from './messages';

export const useAccountTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return useMemo(() => {
        return [
            {
                Header: formatMessage(MESSAGES.name),
                id: 'name',
                accessor: 'name',
                sortable: true,
            },
            {
                Header: formatMessage(MESSAGES.created_at),
                id: 'created_at',
                accessor: 'created_at',
                sortable: true,
                Cell: DateCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                id: 'actions',
                accessor: 'actions',
                sortable: false,
                Cell: (settings: Setting<any>) => {
                    return (
                        <IconButton
                            tooltipMessage={MESSAGES.view}
                            icon="remove-red-eye"
                            url={`/${baseUrls.accountsDetail}/id/${settings.row.original.id}/`}
                        />
                    );
                },
            },
        ];
    }, [formatMessage]);
};
