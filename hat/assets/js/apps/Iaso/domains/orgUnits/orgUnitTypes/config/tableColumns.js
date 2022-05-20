import React from 'react';
import {
    IconButton as IconButtonComponent,
    formatThousand,
} from 'bluesquare-components';
import OrgUnitsTypesDialog from '../components/OrgUnitsTypesDialog';
import DeleteDialog from '../../../../components/dialogs/DeleteDialogComponent';
import MESSAGES from '../messages';
import { DateTimeCell } from '../../../../components/Cells/DateTimeCell';

const TableColumns = (formatMessage, component) => [
    {
        Header: formatMessage(MESSAGES.name),
        accessor: 'name',
        align: 'left',
        sortable: false,
    },
    {
        Header: formatMessage(MESSAGES.shortName),
        accessor: 'short_name',
        sortable: false,
    },
    {
        Header: formatMessage(MESSAGES.validatedOrgUnitCount),
        accessor: 'units_count',
        sortable: false,
        Cell: settings => formatThousand(settings.value),
    },
    {
        Header: formatMessage(MESSAGES.depth),
        headerInfo: formatMessage(MESSAGES.depthInfos),
        accessor: 'depth',
        sortable: false,
    },
    {
        Header: formatMessage(MESSAGES.projects),
        accessor: 'projects',
        sortable: false,
        Cell: settings => settings.value.map(p => p.name).join(', '),
    },
    {
        Header: formatMessage(MESSAGES.createdAt),
        accessor: 'created_at',
        sortable: false,
        Cell: DateTimeCell,
    },
    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        sortable: false,
        Cell: DateTimeCell,
    },
    {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
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
                            id={`edit-button-${settings.row.original.id}`}
                        />
                    )}
                    orgUnitType={settings.row.original}
                    titleMessage={MESSAGES.update}
                    key={settings.row.original.updated_at}
                    params={component.props.params}
                    onConfirmed={() => component.fetchOrgUnitTypes()}
                />
                <DeleteDialog
                    keyName={settings.row.original.id.toString()}
                    disabled={
                        parseInt(settings.row.original.units_count, 10) > 0
                    }
                    titleMessage={MESSAGES.delete}
                    message={MESSAGES.deleteWarning}
                    onConfirm={closeDialog =>
                        component
                            .deleteOrgUnitType(settings.row.original)
                            .then(closeDialog)
                    }
                />
            </section>
        ),
    },
];

export default TableColumns;
