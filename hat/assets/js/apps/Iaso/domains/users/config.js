import React from 'react';
import { textPlaceholder } from '../../constants/uiConstants';
import IconButtonComponent from '../../components/buttons/IconButtonComponent';
import UsersDialog from './components/UsersDialog';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';

import MESSAGES from './messages';

const usersTableColumns = (formatMessage, component) => [
    {
        Header: formatMessage(MESSAGES.userName),
        accessor: 'user__username',
        Cell: settings => <span>{settings.original.user_name}</span>,
    },
    {
        Header: formatMessage(MESSAGES.firstName),
        accessor: 'user__first_name',
        Cell: settings => (
            <span>{settings.original.first_name || textPlaceholder}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.lastName),
        accessor: 'user__last_name',
        Cell: settings => (
            <span>{settings.original.last_name || textPlaceholder}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.email),
        accessor: 'user__email',
        Cell: settings =>
            settings.original.email ? (
                <a href={`mailto:${settings.original.email}`}>
                    {settings.original.email}
                </a>
            ) : (
                textPlaceholder
            ),
    },
    {
        Header: formatMessage(MESSAGES.actions),
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
                    initialData={settings.original}
                    titleMessage={MESSAGES.updateUser}
                    key={settings.original.updated_at}
                    params={component.props.params}
                />
                <DeleteDialog
                    disabled={settings.original.instances_count > 0}
                    titleMessage={MESSAGES.deleteUserTitle}
                    message={MESSAGES.deleteUserText}
                    onConfirm={closeDialog =>
                        component
                            .deleteUser(settings.original)
                            .then(closeDialog)
                    }
                />
            </section>
        ),
    },
];
export default usersTableColumns;
