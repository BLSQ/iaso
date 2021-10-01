import React from 'react';
import {
    formatThousand,
    IconButton as IconButtonComponent,
    textPlaceholder,
} from 'bluesquare-components';
import { Link } from 'react-router';
import GroupsDialog from './components/GroupsDialog';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import MESSAGES from './messages';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import { baseUrls } from '../../../constants/urls';
import { getChipColors } from '../../../constants/chipColors';

const getUrl = groupId => {
    const defaultChipColor = getChipColors(0).replace('#', '');
    return (
        `${baseUrls.orgUnits}/locationLimit/3000/order/id` +
        `/pageSize/50/page/1/searchTabIndex/0/searchActive/true` +
        `/searches/[{"validation_status":"all", "color":"${defaultChipColor}", "group":"${groupId}", "source": null}]`
    );
};
const TableColumns = (formatMessage, component) => [
    {
        Header: formatMessage(MESSAGES.name),
        accessor: 'name',
        align: 'left',
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
                    key={settings.row.original.updated_at}
                    params={component.props.params}
                />
                <DeleteDialog
                    titleMessage={MESSAGES.delete}
                    message={MESSAGES.deleteWarning}
                    onConfirm={closeDialog =>
                        component
                            .deleteGroup(settings.row.original)
                            .then(closeDialog)
                    }
                />
            </section>
        ),
    },
];
export default TableColumns;
