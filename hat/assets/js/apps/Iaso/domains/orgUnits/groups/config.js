import React from 'react';
import IconButtonComponent from '../../../components/buttons/IconButtonComponent';
import GroupsDialog from './components/GroupsDialog';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import ColumnTextComponent from '../../../components/tables/ColumnTextComponent';
import { displayDateFromTimestamp } from '../../../utils/intlUtil';
import { formatThousand } from '../../../utils';
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
            <span>{displayDateFromTimestamp(settings.original.updated_at)}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.sourceVersion),
        accessor: 'source_version',
        Cell: (settings) => {
            const { source_version } = settings.original;
            const text = source_version !== null
                ? `${source_version.data_source.name} - ${source_version.number}`
                : '-';

            return <ColumnTextComponent text={text} />;
        },
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
                    onConfirm={closeDialog => component.deleteGroup(settings.original).then(closeDialog)}
                />
            </section>
        ),
    },
];
export default TableColumns;
