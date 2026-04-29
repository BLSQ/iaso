import React from 'react';
import { Column, useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

export const useGetColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    return [
        {
            Header: 'Id',
            accessor: 'id',
        },
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
        },
        {
            Header: '',
            accessor: 'assignment',
            Cell: settings => {
                const { assignment } = settings.row.original;
                return (
                    <span>
                        {assignment?.user?.username} - {assignment?.team?.name}
                    </span>
                );
            },
        },
    ];
};
