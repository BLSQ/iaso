import React from 'react';
import {
    IconButton as IconButtonComponent,
    ColumnText as ColumnTextComponent,
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
        style: { justifyContent: 'left' },
        Cell: settings => <ColumnTextComponent text={settings.original.name} />,
    },
    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(settings.original.updated_at)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.sourceVersion),
        accessor: '',
        Cell: settings => {
            const sourceVersion = settings.original.source_version;
            const text =
                sourceVersion !== null
                    ? `${sourceVersion.data_source.name} - ${sourceVersion.number}`
                    : textPlaceholder;

            return <ColumnTextComponent text={text} />;
        },
    },
    {
        Header: formatMessage(MESSAGES.sourceRef),
        accessor: 'source_ref',
        Cell: settings => (
            <ColumnTextComponent
                text={settings.original.source_ref || textPlaceholder}
            />
        ),
    },
    {
        Header: formatMessage(MESSAGES.orgUnit),
        accessor: 'org_unit_count',
        Cell: settings => (
            <span>{formatThousand(settings.original.org_unit_count)}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.actions),
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
                    initialData={settings.original}
                    titleMessage={MESSAGES.update}
                    key={settings.original.updated_at}
                    params={component.props.params}
                />
                <DeleteDialog
                    disabled={settings.original.instances_count > 0}
                    titleMessage={MESSAGES.delete}
                    message={MESSAGES.deleteWarning}
                    onConfirm={closeDialog =>
                        component
                            .deleteGroup(settings.original)
                            .then(closeDialog)
                    }
                />
            </section>
        ),
    },
];
export default TableColumns;
