import React, { ReactElement } from 'react';
import MESSAGES from './messages';
import { IntlFormatMessage } from '../../types/intl';
import { Column } from '../../types/table';
import { CreateEditTeam } from './CreateEditTeam';

export const teamColumns = (formatMessage: IntlFormatMessage): Column[] => {
    return [
        {
            Header: 'Id',
            accessor: 'id',
            width: 80,
        },
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
            id: 'name',
        },
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'actions',
            resizable: false,
            sortable: false,
            Cell: (settings): ReactElement => {
                return (
                    // TODO: limit to user permissions
                    <CreateEditTeam
                        type="edit"
                        id={settings.row.original.id}
                        name={settings.row.original?.name}
                        description={settings.row.original?.description}
                        manager={settings.row.original?.manager}
                        subTeams={settings.row.original?.sub_teams}
                        project={settings.row.original?.project}
                    />
                );
            },
        },
    ];
};
