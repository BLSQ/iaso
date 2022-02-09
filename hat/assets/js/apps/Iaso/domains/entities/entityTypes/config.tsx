import React, { ReactElement } from 'react';
import { Box } from '@material-ui/core';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import { EntityTypesDialog } from './components/EntityTypesDialog';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';

import MESSAGES from './messages';

import { baseUrls } from '../../../constants/urls';

import { EntityType } from './types/entityType';
import { Column } from '../../../types/table';
import { IntlMessage } from '../../../types/intl';

export const baseUrl = baseUrls.entityTypes;

type Props = {
    // eslint-disable-next-line no-unused-vars
    formatMessage: (msg: IntlMessage) => string;
    // eslint-disable-next-line no-unused-vars
    deleteEntityType: (e: EntityType) => void;
    // eslint-disable-next-line no-unused-vars
    saveEntityType: (e: EntityType) => void;
};

export const columns = ({
    formatMessage,
    deleteEntityType,
    saveEntityType,
}: Props): Array<Column> => [
    {
        Header: formatMessage(MESSAGES.name),
        id: 'name',
        accessor: 'name',
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
        Header: formatMessage(MESSAGES.entitiesCount),
        accessor: 'entities_count',
        sortable: false,
    },
    {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        Cell: (settings): ReactElement => (
            // TODO: limit to user permissions
            <section>
                {settings.row.original?.defining_form && (
                    <span id="form-link">
                        <IconButtonComponent
                            url={`/${baseUrls.formDetail}/formId/${settings.row.original.defining_form}`}
                            icon="remove-red-eye"
                            tooltipMessage={MESSAGES.viewForm}
                        />
                    </span>
                )}
                <EntityTypesDialog
                    renderTrigger={({ openDialog }) => (
                        <span id="edit-button">
                            <IconButtonComponent
                                onClick={openDialog}
                                icon="edit"
                                tooltipMessage={MESSAGES.edit}
                            />
                        </span>
                    )}
                    initialData={settings.row.original}
                    titleMessage={MESSAGES.updateMessage}
                    saveEntityType={saveEntityType}
                />
                {settings.row.original.entities_count === 0 && (
                    <span id="delete-button">
                        <DeleteDialog
                            keyName="entityType"
                            disabled={settings.row.original.instances_count > 0}
                            titleMessage={MESSAGES.deleteTitle}
                            message={MESSAGES.deleteText}
                            onConfirm={() =>
                                deleteEntityType(settings.row.original)
                            }
                        />
                    </span>
                )}
            </section>
        ),
    },
];
