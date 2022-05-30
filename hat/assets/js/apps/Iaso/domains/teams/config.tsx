import React, { ReactElement } from 'react';
import { Chip, Box } from '@material-ui/core';

import MESSAGES from './messages';
import { IntlFormatMessage } from '../../types/intl';
import { Column } from '../../types/table';
import { CreateEditTeam } from './CreateEditTeam';
import { TEAM_OF_TEAMS, TEAM_OF_USERS } from './constants';

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
            Header: formatMessage(MESSAGES.type),
            accessor: 'type',
            id: 'type',
            Cell: (settings): ReactElement => {
                const { type } = settings.row.original;
                if (type === TEAM_OF_TEAMS) {
                    return <span>{formatMessage(MESSAGES.teamsOfTeams)}</span>;
                }
                if (type === TEAM_OF_USERS) {
                    return <span>{formatMessage(MESSAGES.teamsOfUsers)}</span>;
                }
                return <span>-</span>;
            },
        },
        {
            Header: formatMessage(MESSAGES.usersTeams),
            accessor: 'users_details',
            sortable: false,
            Cell: (settings): ReactElement => {
                const { type, sub_teams_details, users_details } =
                    settings.row.original;
                if (type === TEAM_OF_TEAMS) {
                    return sub_teams_details.map(team => (
                        <Box key={team.id} ml={1} display="inline-block">
                            <Chip label={team.name} color="primary" />
                        </Box>
                    ));
                }
                if (type === TEAM_OF_USERS) {
                    return users_details.map(user => (
                        <Box ml={1} display="inline-block" key={user.id}>
                            <Chip label={user.username} color="secondary" />
                        </Box>
                    ));
                }
                return <span>-</span>;
            },
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
                        dialogType="edit"
                        id={settings.row.original.id}
                        name={settings.row.original.name}
                        description={settings.row.original.description}
                        manager={settings.row.original.manager}
                        subTeams={settings.row.original.sub_teams}
                        project={settings.row.original.project}
                        type={settings.row.original.type}
                        users={settings.row.original.users}
                    />
                );
            },
        },
    ];
};
