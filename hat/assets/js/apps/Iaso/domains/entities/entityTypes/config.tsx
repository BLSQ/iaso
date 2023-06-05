import React, { ReactElement } from 'react';
// @ts-ignore
import {
    IconButton as IconButtonComponent,
    IntlMessage,
    Column,
} from 'bluesquare-components';
import { EntityTypesDialog } from './components/EntityTypesDialog';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import Workflow from '../../../components/svg/Workflow';

import MESSAGES from './messages';

import { baseUrls } from '../../../constants/urls';

import { EntityType } from './types/entityType';

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
                {settings.row.original?.reference_form && (
                    <IconButtonComponent
                        id={`form-link-${settings.row.original.id}`}
                        url={`/${baseUrls.formDetail}/formId/${settings.row.original.reference_form}`}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.viewForm}
                    />
                )}
                <EntityTypesDialog
                    renderTrigger={({ openDialog }) => (
                        <IconButtonComponent
                            id={`edit-button-${settings.row.original.id}`}
                            onClick={openDialog}
                            icon="edit"
                            dataTestId="edit-button"
                            tooltipMessage={MESSAGES.edit}
                        />
                    )}
                    initialData={settings.row.original}
                    titleMessage={MESSAGES.updateMessage}
                    saveEntityType={saveEntityType}
                />
                {settings.row.original.entities_count === 0 && (
                    <DeleteDialog
                        keyName={`entityType-${settings.row.original.id}`}
                        disabled={settings.row.original.instances_count > 0}
                        titleMessage={MESSAGES.deleteTitle}
                        message={MESSAGES.deleteText}
                        onConfirm={() =>
                            deleteEntityType(settings.row.original)
                        }
                    />
                )}
                <IconButtonComponent
                    id={`workflow-link-${settings.row.original.id}`}
                    url={`/${baseUrls.workflows}/entityTypeId/${settings.row.original.id}`}
                    icon="remove-red-eye"
                    tooltipMessage={MESSAGES.workflow}
                    overrideIcon={Workflow}
                />
            </section>
        ),
    },
];
