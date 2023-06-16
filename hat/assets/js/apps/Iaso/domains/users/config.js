import React from 'react';
import { textPlaceholder } from 'bluesquare-components';
import { EditUsersDialog } from './components/UsersDialog.tsx';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';

import MESSAGES from './messages';

const usersTableColumns = ({
    formatMessage,
    deleteProfile,
    params,
    currentUser,
    saveProfile,
}) => [
    {
        Header: formatMessage(MESSAGES.userName),
        id: 'user__username',
        accessor: 'user_name',
    },
    {
        Header: formatMessage(MESSAGES.firstName),
        id: 'user__first_name',
        accessor: 'first_name',
    },
    {
        Header: formatMessage(MESSAGES.lastName),
        id: 'user__last_name',
        accessor: 'last_name',
    },
    {
        Header: formatMessage(MESSAGES.email),
        id: 'user__email',
        accessor: 'email',
        Cell: settings =>
            settings.value ? (
                <a href={`mailto:${settings.value}`}>{settings.value}</a>
            ) : (
                textPlaceholder
            ),
    },
    {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        Cell: settings => (
            <section>
                <EditUsersDialog
                    initialData={settings.row.original}
                    titleMessage={MESSAGES.updateUser}
                    params={params}
                    saveProfile={saveProfile}
                />
                {currentUser.id !== settings.row.original.id && (
                    <DeleteDialog
                        disabled={settings.row.original.instances_count > 0}
                        titleMessage={MESSAGES.deleteUserTitle}
                        message={MESSAGES.deleteUserText}
                        onConfirm={() => deleteProfile(settings.row.original)}
                    />
                )}
            </section>
        ),
    },
];
export default usersTableColumns;
