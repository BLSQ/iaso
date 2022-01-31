import React from 'react';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import Dialog from './components/Dialog';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';

import MESSAGES from './messages';

import { baseUrls } from '../../constants/urls';

export const baseUrl = baseUrls.entities;

export const columns = ({
    params,
    formatMessage,
    deleteEntitiy,
    saveEntity,
}) => [
    {
        Header: formatMessage(MESSAGES.name),
        id: 'name',
        accessor: 'name',
    },
    {
        Header: formatMessage(MESSAGES.types),
        id: 'entity_type_name',
        accessor: 'entity_type_name',
        sortable: false,
    },
    {
        Header: formatMessage(MESSAGES.created_at),
        accessor: 'created_at',
        Cell: DateTimeCell,
    },
    {
        Header: formatMessage(MESSAGES.updated_at),
        accessor: 'updated_at',
        Cell: DateTimeCell,
    },
    {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        Cell: settings => (
            <section>
                <Dialog
                    renderTrigger={({ openDialog }) => (
                        <IconButtonComponent
                            onClick={openDialog}
                            icon="edit"
                            tooltipMessage={MESSAGES.edit}
                        />
                    )}
                    initialData={settings.row.original}
                    titleMessage={MESSAGES.updateMessage}
                    params={params}
                    saveEntity={saveEntity}
                />
                <DeleteDialog
                    disabled={settings.row.original.instances_count > 0}
                    titleMessage={MESSAGES.deleteTitle}
                    message={MESSAGES.deleteText}
                    onConfirm={() => deleteEntitiy(settings.row.original)}
                />
            </section>
        ),
    },
];
