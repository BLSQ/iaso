import React from 'react';
import {
    formatThousand,
    IconButton,
    textPlaceholder,
    LinkWithLocation,
} from 'bluesquare-components';
import GroupsDialog from './components/GroupsDialog';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import MESSAGES from './messages';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell.tsx';
import { baseUrls } from '../../../constants/urls';
import { filterOrgUnitsByGroupUrl } from '../utils';

export const baseUrl = baseUrls.groups;

const TableColumns = (formatMessage, params, deleteGroup, saveGroup) => [
    {
        Header: 'Id',
        accessor: 'id',
    },
    {
        Header: formatMessage(MESSAGES.name),
        accessor: 'name',
    },
    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        Cell: DateTimeCell,
    },
    {
        Header: formatMessage(MESSAGES.sourceVersion),
        accessor: 'source_version',
        sortable: false,
        Cell: settings =>
            settings.value !== null
                ? `${settings.value.data_source.name} - ${settings.value.number}`
                : textPlaceholder,
    },
    {
        Header: formatMessage(MESSAGES.sourceRef),
        accessor: 'source_ref',
    },
    {
        Header: formatMessage(MESSAGES.orgUnit),
        accessor: 'org_unit_count',
        Cell: settings => (
            <LinkWithLocation
                to={filterOrgUnitsByGroupUrl(settings.row.original.id)}
            >
                {formatThousand(settings.value)}
            </LinkWithLocation>
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
                        <IconButton
                            onClick={openDialog}
                            icon="edit"
                            tooltipMessage={MESSAGES.edit}
                        />
                    )}
                    initialData={settings.row.original}
                    titleMessage={MESSAGES.update}
                    params={params}
                    saveGroup={saveGroup}
                />
                <DeleteDialog
                    keyName="group"
                    titleMessage={MESSAGES.delete}
                    message={MESSAGES.deleteWarning}
                    onConfirm={() => deleteGroup(settings.row.original)}
                />
            </section>
        ),
    },
];
export default TableColumns;
