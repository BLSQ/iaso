import React from 'react';
import {
    IconButton as IconButtonComponent,
    textPlaceholder,
} from 'bluesquare-components';
import UsersDialog from './components/UsersDialog';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';

import MESSAGES from './messages';

const usersTableColumns = (formatMessage, deleteUser, params) => [
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
                <UsersDialog
                    renderTrigger={({ openDialog }) => (
                        <IconButtonComponent
                            onClick={openDialog}
                            icon="edit"
                            tooltipMessage={MESSAGES.edit}
                        />
                    )}
                    initialData={settings.row.original}
                    titleMessage={MESSAGES.updateUser}
                    key={settings.row.original.updated_at}
                    params={params}
                />
                <DeleteDialog
                    disabled={settings.row.original.instances_count > 0}
                    titleMessage={MESSAGES.deleteUserTitle}
                    message={MESSAGES.deleteUserText}
                    onConfirm={closeDialog =>
                        deleteUser(settings.row.original).then(closeDialog)
                    }
                />
            </section>
        ),
    },
];
export default usersTableColumns;
