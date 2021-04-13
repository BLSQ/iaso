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
        sortable: false,
        style: { justifyContent: 'left' },
        Cell: settings => <ColumnTextComponent text={settings.original.name} />,
    },
    {
        Header: formatMessage(MESSAGES.shortName),
        accessor: 'short_name',
        sortable: false,
        Cell: settings => (
            <ColumnTextComponent text={settings.original.short_name} />
        ),
    },
    {
        Header: formatMessage(MESSAGES.depth),
        headerInfo: formatMessage(MESSAGES.depth),
        accessor: 'depth',
        sortable: false,
        Cell: settings => (
            <ColumnTextComponent
                text={
                    settings.original.depth !== null
                        ? settings.original.depth
                        : '-'
                }
            />
        ),
    },
    {
        Header: formatMessage(MESSAGES.projects),
        accessor: 'projects',
        sortable: false,
        Cell: settings => (
            <ColumnTextComponent
                text={settings.original.projects.map(p => p.name).join(', ')}
            />
        ),
    },
    {
        Header: formatMessage(MESSAGES.createdAt),
        accessor: 'created_at',
        sortable: false,
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(settings.original.created_at)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        sortable: false,
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(settings.original.updated_at)}
            </span>
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
                    orgUnitType={settings.original}
                    titleMessage={MESSAGES.update}
                    key={settings.original.updated_at}
                    params={component.props.params}
                    onConfirmed={() => component.fetchOrgUnitTypes()}
                />
                <DeleteDialog
                    disabled={settings.original.instances_count > 0}
                    titleMessage={MESSAGES.delete}
                    message={MESSAGES.deleteWarning}
                    onConfirm={closeDialog =>
                        component
                            .deleteOrgUnitType(settings.original)
                            .then(closeDialog)
                    }
                />
            </section>
        ),
    },
];
export default TableColumns;
