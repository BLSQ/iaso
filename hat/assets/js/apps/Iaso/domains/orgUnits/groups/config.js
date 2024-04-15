import React from 'react';
import {
    formatThousand,
    IconButton as IconButtonComponent,
    textPlaceholder,
} from 'bluesquare-components';
import { Link } from 'react-router-dom';
import GroupsDialog from './components/GroupsDialog';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import MESSAGES from './messages';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell.tsx';
import { baseUrls } from '../../../constants/urls';
import { getChipColors } from '../../../constants/chipColors';

export const baseUrl = baseUrls.groups;

const getUrl = groupId => {
    const defaultChipColor = getChipColors(0).replace('#', '');
    return (
        `${baseUrls.orgUnits}/locationLimit/3000/order/id` +
        `/pageSize/50/page/1/searchTabIndex/0/searchActive/true` +
        `/searches/[{"validation_status":"all", "color":"${defaultChipColor}", "group":"${groupId}", "source": null}]`
    );
};
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
            <Link to={getUrl(settings.row.original.id)}>
                {formatThousand(settings.value)}
            </Link>
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
