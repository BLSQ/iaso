import React from 'react';
import { textPlaceholder } from '../../constants/uiConstants';
import RowButtonComponent from '../../components/buttons/RowButtonComponent';
import UsersDialog from './components/UsersDialog';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';

const usersTableColumns = (formatMessage, component) => [
    {
        Header: formatMessage({
            defaultMessage: 'User name',
            id: 'iaso.label.userName',
        }),
        accessor: 'user__username',
        Cell: settings => <span>{settings.original.user_name}</span>,
    },
    {
        Header: formatMessage({
            defaultMessage: 'First name',
            id: 'iaso.label.firstName',
        }),
        accessor: 'user__first_name',
        Cell: settings => <span>{settings.original.first_name || textPlaceholder}</span>,
    },
    {
        Header: formatMessage({
            defaultMessage: 'Last name',
            id: 'iaso.label.lastName',
        }),
        accessor: 'user__last_name',
        Cell: settings => <span>{settings.original.last_name || textPlaceholder}</span>,
    },
    {
        Header: formatMessage({
            defaultMessage: 'Email',
            id: 'iaso.label.email',
        }),
        accessor: 'user__email',
        Cell: settings => (settings.original.email
            ? <a href={`mailto:${settings.original.email}`}>{settings.original.email}</a> : textPlaceholder),
    },
    {
        Header: formatMessage({
            defaultMessage: 'Action(s)',
            id: 'iaso.labels.actions',
        }),
        resizable: false,
        sortable: false,
        Cell: settings => (
            <section>
                <UsersDialog
                    renderTrigger={({ openDialog }) => (
                        <RowButtonComponent
                            onClick={openDialog}
                            icon="edit"
                            tooltipMessage={{ id: 'iaso.label.edit', defaultMessage: 'Edit' }}
                        />
                    )}
                    initialData={settings.original}
                    titleMessage={{ id: 'iaso.users.update', defaultMessage: 'Update user' }}
                    key={settings.original.updated_at}
                    params={component.props.params}
                />
                <DeleteDialog
                    disabled={settings.original.instances_count > 0}
                    titleMessage={{
                        id: 'iaso.users.dialog.deleteUserTitle',
                        defaultMessage: 'Are you sure you want to delete this user?',
                    }}
                    message={{
                        id: 'iaso.users.dialog.deleteUserTitle',
                        defaultMessage: 'This operation cannot be undone.',
                    }}
                    onConfirm={closeDialog => component.deleteUser(settings.original).then(closeDialog)}
                />
            </section>
        ),
    },
];
export default usersTableColumns;
