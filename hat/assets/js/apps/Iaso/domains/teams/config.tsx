import React, { ReactElement } from 'react';

import { IntlFormatMessage, Column } from 'bluesquare-components';
import MESSAGES from './messages';

import { Team } from './types/team';

import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import { CreateEditTeam } from './components/CreateEditTeam';
import { TypeCell } from './components/TypeCell';
import { UsersTeamsCell } from './components/UsersTeamsCell';

export const teamColumns = (
    formatMessage: IntlFormatMessage,
    // eslint-disable-next-line no-unused-vars
    deleteTeam: (team: Team) => void,
): Column[] => {
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
            Header: formatMessage(MESSAGES.type),
            accessor: 'type',
            id: 'type',
            Cell: (settings): ReactElement => (
                <TypeCell type={settings.row.original.type} />
            ),
        },
        {
            Header: formatMessage(MESSAGES.usersTeams),
            accessor: 'users_details',
            sortable: false,
            Cell: (settings): ReactElement => (
                <UsersTeamsCell
                    type={settings.row.original.type}
                    subTeamsDetails={settings.row.original.sub_teams_details}
                    usersDetails={settings.row.original.users_details}
                />
            ),
        },
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'actions',
            resizable: false,
            sortable: false,
            Cell: (settings): ReactElement => {
                return (
                    // TODO: limit to user permissions
                    <>
                        <CreateEditTeam
                            dialogType="edit"
                            id={settings.row.original.id}
                            name={settings.row.original.name}
                            description={settings.row.original.description}
                            manager={settings.row.original.manager}
                            subTeams={settings.row.original.sub_teams}
                            project={settings.row.original.project}
                            type={settings.row.original.type}
                            users={settings.row.original.users}
                            parent={settings.row.original.parent}
                        />
                        <DeleteDialog
                            keyName="team"
                            titleMessage={MESSAGES.delete}
                            onConfirm={() => deleteTeam(settings.row.original)}
                        />
                    </>
                );
            },
        },
    ];
};
