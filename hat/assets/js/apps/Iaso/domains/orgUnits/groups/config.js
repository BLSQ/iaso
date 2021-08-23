import React from 'react';
import {
    IconButton as IconButtonComponent,
    displayDateFromTimestamp,
    formatThousand,
    textPlaceholder,
} from 'bluesquare-components';
import GroupsDialog from './components/GroupsDialog';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import MESSAGES from './messages';

const TableColumns = (formatMessage, component) => [
    {
        Header: formatMessage(MESSAGES.name),
        accessor: 'name',
        align: 'left',
        Cell: settings => settings.cell.row.original.name,
    },
    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(
                    settings.cell.row.original.updated_at,
                )}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.sourceVersion),
        accessor: 'source_version',
        sortable: false,
        Cell: settings => {
            const sourceVersion = settings.cell.row.original.source_version;
            const text =
                sourceVersion !== null
                    ? `${sourceVersion.data_source.name} - ${sourceVersion.number}`
                    : textPlaceholder;

            return text;
        },
    },
    {
        Header: formatMessage(MESSAGES.sourceRef),
        accessor: 'source_ref',
        Cell: settings =>
            settings.cell.row.original.source_ref || textPlaceholder,
    },
    {
        Header: formatMessage(MESSAGES.orgUnit),
        accessor: 'org_unit_count',
        Cell: settings => (
            <span>
                {formatThousand(settings.cell.row.original.org_unit_count)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        Cell: settings => (
            <section>
                <GroupsDialog
                    renderTrigger={({ openDialog }) => (
                        <IconButtonComponent
                            onClick={openDialog}
                            icon="edit"
                            tooltipMessage={MESSAGES.edit}
                        />
                    )}
                    initialData={settings.cell.row.original}
                    titleMessage={MESSAGES.update}
                    key={settings.cell.row.original.updated_at}
                    params={component.props.params}
                />
                <DeleteDialog
                    disabled={settings.cell.row.original.instances_count > 0}
                    titleMessage={MESSAGES.delete}
                    message={MESSAGES.deleteWarning}
                    onConfirm={closeDialog =>
                        component
                            .deleteGroup(settings.cell.row.original)
                            .then(closeDialog)
                    }
                />
            </section>
        ),
    },
];
export default TableColumns;
