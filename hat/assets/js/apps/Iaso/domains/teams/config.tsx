import React, { ReactElement } from 'react';
import { Box } from '@mui/material';
import { Column, useSafeIntl } from 'bluesquare-components';
import { ColorPicker } from 'Iaso/components/forms/ColorPicker';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import { ProjectChip } from '../projects/components/ProjectChip';
import { EditTeamModal } from './components/CreateEditTeam';
import { TypeCell } from './components/TypeCell';
import { UsersTeamsCell } from './components/UsersTeamsCell';
import { useDeleteTeam } from './hooks/requests/useDeleteTeam';
import { useSaveTeam } from './hooks/requests/useSaveTeam';
import MESSAGES from './messages';

export const useTeamColumns = ({params, data}): Column[] => {
    const { mutate: deleteTeam } = useDeleteTeam({params, count: data?.count ?? 0});
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: saveTeam } = useSaveTeam('edit', false);
    return [
        {
            Header: 'Id',
            accessor: 'id',
            width: 80,
        },
        {
            Header: formatMessage(MESSAGES.color),
            accessor: 'color',
            id: 'color',
            width: 10,
            sortable: false,
            Cell: settings => (
                <Box display="flex" justifyContent="center">
                    <ColorPicker
                        currentColor={settings.row.original.color}
                        displayLabel={false}
                        onChangeColor={color =>
                            saveTeam({
                                id: settings.row.original.id,
                                color,
                            })
                        }
                    />
                </Box>
            ),
        },
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
            id: 'name',
        },
        {
            Header: formatMessage(MESSAGES.project),
            accessor: 'project_details',
            id: 'project__name',
            Cell: settings => (
                <ProjectChip project={settings.row.original.project_details} />
            ),
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
                        <EditTeamModal
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
                            color={settings.row.original.color}
                            iconProps={{}}
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
