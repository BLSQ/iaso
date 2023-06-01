// import React, { ReactElement } from 'react';

import MESSAGES from './messages';

import { IntlFormatMessage } from '../../types/intl';
import { Column } from '../../types/table';
// import { UserRole } from './types/userRoles';

// import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
// import { CreateEditTeam } from './components/CreateEditTeam';
// import { TypeCell } from './components/TypeCell';
// import { UsersTeamsCell } from './components/UsersTeamsCell';

export const userRolesColumns = (
    formatMessage: IntlFormatMessage,
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
            Header: formatMessage(MESSAGES.created_at),
            accessor: 'created_at',
            id: 'created_at',
        },
        {
            Header: formatMessage(MESSAGES.updated_at),
            accessor: 'updated_at',
            id: 'updated_at',
        },
        // {
        //     Header: formatMessage(MESSAGES.usersTeams),
        //     accessor: 'users_details',
        //     sortable: false,
        //     Cell: (settings): ReactElement => (
        //         <UsersTeamsCell
        //             type={settings.row.original.type}
        //             subTeamsDetails={settings.row.original.sub_teams_details}
        //             usersDetails={settings.row.original.users_details}
        //         />
        //     ),
        // },
        // {
        //     Header: formatMessage(MESSAGES.actions),
        //     accessor: 'actions',
        //     resizable: false,
        //     sortable: false,
        //     Cell: (settings): ReactElement => {
        //         return (
        //             // TODO: limit to user permissions
        //             <>
        //                 <CreateEditTeam
        //                     dialogType="edit"
        //                     id={settings.row.original.id}
        //                     name={settings.row.original.name}
        //                     description={settings.row.original.description}
        //                     manager={settings.row.original.manager}
        //                     subTeams={settings.row.original.sub_teams}
        //                     project={settings.row.original.project}
        //                     type={settings.row.original.type}
        //                     users={settings.row.original.users}
        //                     parent={settings.row.original.parent}
        //                 />
        //                 <DeleteDialog
        //                     keyName="team"
        //                     titleMessage={MESSAGES.delete}
        //                     onConfirm={() => deleteTeam(settings.row.original)}
        //                 />
        //             </>
        //         );
        //     },
        // },
    ];
};
