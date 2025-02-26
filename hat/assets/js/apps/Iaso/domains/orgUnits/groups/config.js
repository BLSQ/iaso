import React from 'react';
import { Chip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    formatThousand,
    IconButton,
    textPlaceholder,
    LinkWithLocation,
} from 'bluesquare-components';
import { useNavigate } from 'react-router-dom';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell.tsx';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import { baseUrls } from '../../../constants/urls';
import { filterOrgUnitsByGroupUrl } from '../utils';
import GroupsDialog from './components/GroupsDialog';
import MESSAGES from './messages';

const useStyles = makeStyles(() => ({
    groupSetChip: {
        margin: '2px !important',
    },
}));

export const baseUrl = baseUrls.groups;
const groupSetUrl = baseUrls.groupSetDetail;

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
        Header: formatMessage(MESSAGES.groupSet),
        accessor: 'group_sets',
        Cell: settings => {
            const classes = useStyles();
            const navigate = useNavigate();
            return (
                <span>
                    {settings.row.original.group_sets.map(g => (
                        <Chip
                            className={classes.groupSetChip}
                            label={g.name}
                            color="primary"
                            key={g.id}
                            onClick={() => {
                                navigate(`/${groupSetUrl}/groupSetId/${g.id}`);
                            }}
                        />
                    ))}
                </span>
            );
        },
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
