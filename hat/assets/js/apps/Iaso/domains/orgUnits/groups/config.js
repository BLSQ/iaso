import React from 'react';
import EditRowButtonComponent from '../../../components/buttons/EditRowButtonComponent';
import GroupsDialog from './components/GroupsDialog';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import ColumnTextComponent from '../../../components/tables/ColumnTextComponent';
import { displayDateFromTimestamp } from '../../../utils/intlUtil';
import { formatThousand } from '../../../../../utils';

const TableColumns = (formatMessage, component) => [
    {
        Header: formatMessage({
            defaultMessage: 'Name',
            id: 'iaso.label.name',
        }),
        accessor: 'name',
        style: { justifyContent: 'left' },
        Cell: settings => <ColumnTextComponent text={settings.original.name} />,
    },
    {
        Header: formatMessage({
            defaultMessage: 'Source version',
            id: 'iaso.groups.sourceVersion',
        }),
        accessor: 'source_version',
    },
    {
        Header: formatMessage({
            defaultMessage: 'Source version',
            id: 'iaso.groups.sourceRef',
        }),
        accessor: 'source_ref',
    },
    {
        Header: formatMessage({
            defaultMessage: 'Updated at',
            id: 'iaso.forms.updated_at',
        }),
        accessor: 'instance_updated_at',
        Cell: settings => (
            <span>{displayDateFromTimestamp(settings.original.updated_at)}</span>
        ),
    },
    {
        Header: formatMessage({
            defaultMessage: 'Org units',
            id: 'iaso.label.orgUnit',
        }),
        accessor: 'org_unit_count',
        Cell: settings => (
            <span>{formatThousand(settings.original.org_unit_count)}</span>
        ),
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
                <GroupsDialog
                    renderTrigger={({ openDialog }) => <EditRowButtonComponent onClick={openDialog} />}
                    initialData={settings.original}
                    titleMessage={{ id: 'iaso.groups.update', defaultMessage: 'Update group' }}
                    key={settings.original.updated_at}
                    params={component.props.params}
                />
                <DeleteDialog
                    disabled={settings.original.instances_count > 0}
                    titleMessage={{
                        id: 'iaso.groups.dialog.delete',
                        defaultMessage: 'Are you sure you want to delete this group?',
                    }}
                    message={{
                        id: 'iaso.users.dialog.deleteUserTitle',
                        defaultMessage: 'This operation cannot be undone.',
                    }}
                    onConfirm={closeDialog => component.deleteGroup(settings.original).then(closeDialog)}
                />
            </section>
        ),
    },
];
export default TableColumns;
