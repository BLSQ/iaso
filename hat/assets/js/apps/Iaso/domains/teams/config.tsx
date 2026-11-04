import React, { ReactElement } from 'react';
import { Column, Setting, useSafeIntl } from 'bluesquare-components';
import { PaginatedTeamListList, useApiTeamsDestroy } from 'Iaso/api/teams';
import { ColorBadge } from 'Iaso/components/ColorBadge';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import {
    ProjectChip,
    ProjectChipProps,
} from '../projects/components/ProjectChip';
import { EditTeamModal } from './components/CreateEditTeam';
import { TypeCell } from './components/TypeCell';
import MESSAGES from './messages';

export const useTeamColumns = (): Column[] => {
    const { mutate: deleteTeam } = useApiTeamsDestroy();
    const { formatMessage } = useSafeIntl();
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
            Cell: (
                settings: Setting<
                    NonNullable<PaginatedTeamListList['results']>[number]
                >,
            ) => (
                <ColorBadge
                    data-testid={'team-badge-color'}
                    backgroundColor={settings.row.original.color}
                />
            ),
        },
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
            id: 'name',
        },
        {
            Header: formatMessage(MESSAGES.project),
            accessor: 'project',
            id: 'project__name',
            Cell: (
                settings: Setting<
                    NonNullable<PaginatedTeamListList['results']>[number]
                >,
            ) => (
                <ProjectChip
                    project={
                        settings.row.original
                            .project satisfies ProjectChipProps['project']
                    }
                />
            ),
        },
        {
            Header: formatMessage(MESSAGES.type),
            accessor: 'type',
            id: 'type',
            Cell: (
                settings: Setting<
                    NonNullable<PaginatedTeamListList['results']>[number]
                >,
            ): ReactElement => <TypeCell type={settings.row.original.type} />,
        },
        {
            Header: formatMessage(MESSAGES.membersCount),
            accessor: 'members_count',
            id: 'members_count',
            sortable: true,
        },
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'actions',
            resizable: false,
            sortable: false,
            Cell: (
                settings: Setting<
                    NonNullable<PaginatedTeamListList['results']>[number]
                >,
            ): ReactElement => {
                return (
                    // TODO: limit to user permissions
                    <>
                        <EditTeamModal
                            dialogType="edit"
                            id={settings.row.original.id}
                            iconProps={{}}
                        />
                        <DeleteDialog
                            keyName="team"
                            titleMessage={MESSAGES.delete}
                            onConfirm={() =>
                                deleteTeam({ id: settings.row.original.id })
                            }
                        />
                    </>
                );
            },
        },
    ];
};
