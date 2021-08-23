import React from 'react';
import {
    IconButton as IconButtonComponent,
    displayDateFromTimestamp,
    formatThousand,
} from 'bluesquare-components';
import OrgUnitsTypesDialog from './components/OrgUnitsTypesDialog';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import MESSAGES from './messages';

const TableColumns = (formatMessage, component) => [
    {
        Header: formatMessage(MESSAGES.name),
        accessor: 'name',
        sortable: false,
        style: { justifyContent: 'left' },
        Cell: settings => settings.cell.row.original.name,
    },
    {
        Header: formatMessage(MESSAGES.shortName),
        accessor: 'short_name',
        sortable: false,
        Cell: settings => settings.cell.row.original.short_name,
    },
    {
        Header: formatMessage(MESSAGES.validatedOrgUnitCount),
        accessor: 'units_count',
        sortable: false,
        Cell: settings =>
            formatThousand(settings.cell.row.original.units_count),
    },
    {
        Header: formatMessage(MESSAGES.depth),
        headerInfo: formatMessage(MESSAGES.depthInfos),
        accessor: 'depth',
        sortable: false,
        Cell: settings =>
            settings.cell.row.original.depth !== null
                ? settings.cell.row.original.depth
                : '-',
    },
    {
        Header: formatMessage(MESSAGES.projects),
        accessor: 'projects',
        sortable: false,
        Cell: settings =>
            settings.cell.row.original.projects.map(p => p.name).join(', '),
    },
    {
        Header: formatMessage(MESSAGES.createdAt),
        accessor: 'created_at',
        sortable: false,
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(
                    settings.cell.row.original.created_at,
                )}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        sortable: false,
        Cell: settings => (
            <span>
                {displayDateFromTimestamp(
                    settings.cell.row.original.updated_at,
                )}
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
                    orgUnitType={settings.cell.row.original}
                    titleMessage={MESSAGES.update}
                    key={settings.cell.row.original.updated_at}
                    params={component.props.params}
                    onConfirmed={() => component.fetchOrgUnitTypes()}
                />
                <DeleteDialog
                    disabled={settings.cell.row.original.instances_count > 0}
                    titleMessage={MESSAGES.delete}
                    message={MESSAGES.deleteWarning}
                    onConfirm={closeDialog =>
                        component
                            .deleteOrgUnitType(settings.cell.row.original)
                            .then(closeDialog)
                    }
                />
            </section>
        ),
    },
];
export default TableColumns;
