import React from 'react';
import IconButtonComponent from '../../../components/buttons/IconButtonComponent';
import OrgUnitsTypesDialog from './components/OrgUnitsTypesDialog';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import ColumnTextComponent from '../../../components/tables/ColumnTextComponent';
import { displayDateFromTimestamp } from '../../../utils/intlUtil';
import MESSAGES from './messages';

const TableColumns = (formatMessage, component) => [
    {
        Header: formatMessage(MESSAGES.name),
        accessor: 'name',
        style: { justifyContent: 'left' },
        Cell: settings => <ColumnTextComponent text={settings.original.name} />,
    },
    {
        Header: formatMessage(MESSAGES.shortName),
        accessor: 'short_name',
        Cell: settings => <ColumnTextComponent text={settings.original.short_name} />,
    },
    {
        Header: formatMessage(MESSAGES.createdAt),
        accessor: 'created_at',
        Cell: settings => (
            <span>{displayDateFromTimestamp(settings.original.created_at)}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        Cell: settings => (
            <span>{displayDateFromTimestamp(settings.original.updated_at)}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.actions),
        resizable: false,
        sortable: false,
        Cell: settings => (
            <section>
                <OrgUnitsTypesDialog
                    renderTrigger={({ openDialog }) => (
                        <IconButtonComponent
                            onClick={openDialog}
                            icon="edit"
                            tooltipMessage={MESSAGES.edit}
                        />
                    )}
                    titleMessage={MESSAGES.update}
                    key={settings.original.id}
                    params={component.props.params}
                />
                <DeleteDialog
                    disabled={settings.original.instances_count > 0}
                    titleMessage={MESSAGES.delete}
                    message={MESSAGES.deleteWarning}
                    onConfirm={closeDialog => component.deleteOrgUnitType(settings.original).then(closeDialog)}
                />
            </section>
        ),
    },
];
export default TableColumns;
