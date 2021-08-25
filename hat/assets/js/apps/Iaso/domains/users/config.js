import React from 'react';
import {
    IconButton as IconButtonComponent,
    textPlaceholder,
} from 'bluesquare-components';
import UsersDialog from './components/UsersDialog';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';

import MESSAGES from './messages';

const usersTableColumns = (formatMessage, component) => [
    {
        Header: formatMessage(MESSAGES.userName),
        accessor: 'user__username',
        Cell: settings => <span>{settings.row.original.user_name}</span>,
    },
    {
        Header: formatMessage(MESSAGES.firstName),
        accessor: 'user__first_name',
        Cell: settings => (
            <span>{settings.row.original.first_name || textPlaceholder}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.lastName),
        accessor: 'user__last_name',
        Cell: settings => (
            <span>{settings.row.original.last_name || textPlaceholder}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.email),
        accessor: 'user__email',
        Cell: settings =>
            settings.row.original.email ? (
                <a href={`mailto:${settings.row.original.email}`}>
                    {settings.row.original.email}
                </a>
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
                    params={component.props.params}
                />
                <DeleteDialog
                    disabled={settings.row.original.instances_count > 0}
                    titleMessage={MESSAGES.deleteUserTitle}
                    message={MESSAGES.deleteUserText}
                    onConfirm={closeDialog =>
                        component
                            .deleteUser(settings.row.original)
                            .then(closeDialog)
                    }
                />
            </section>
        ),
    },
];
export default usersTableColumns;
