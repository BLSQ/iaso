import React from 'react';
import { Grid } from '@material-ui/core';
import { Link } from 'react-router';
import { IconButton as IconButtonComponent } from 'bluesquare-components';
import MESSAGES from './messages';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';

const archivedTableColumn = (
    formatMessage,
    restoreForm,
    hasPermission = false,
) => {
    const columns = [
        {
            Header: formatMessage(MESSAGES.name),
            accessor: 'name',
        },
        {
            Header: formatMessage(MESSAGES.form_id),
            sortable: false,
            accessor: 'form_id',
        },
        {
            Header: formatMessage(MESSAGES.type),
            sortable: false,
            accessor: 'org_unit_types',
            Cell: settings =>
                settings.row.original.org_unit_types
                    .map(o => o.short_name)
                    .join(', '),
        },
        {
            Header: formatMessage(MESSAGES.records),
            accessor: 'instances_count',
        },
        {
            Header: formatMessage(MESSAGES.latest_version_files),
            accessor: 'latest_version_files',
            sortable: false,
            Cell: settings =>
                settings.row.original.latest_form_version !== null && (
                    <Grid container spacing={1} justifyContent="center">
                        <Grid item>
                            {
                                settings.row.original.latest_form_version
                                    .version_id
                            }
                        </Grid>
                        <Grid container spacing={1} justifyContent="center">
                            {settings.row.original.latest_form_version
                                .xls_file && (
                                <Grid item>
                                    <Link
                                        download
                                        href={
                                            settings.row.original
                                                .latest_form_version.xls_file
                                        }
                                    >
                                        XLS
                                    </Link>
                                </Grid>
                            )}
                            <Grid item>
                                <Link
                                    download
                                    href={
                                        settings.row.original
                                            .latest_form_version.file
                                    }
                                >
                                    XML
                                </Link>
                            </Grid>
                        </Grid>
                    </Grid>
                ),
        },
        {
            Header: formatMessage(MESSAGES.created_at),
            accessor: 'created_at',
            Cell: DateTimeCell,
        },
        {
            Header: formatMessage(MESSAGES.updated_at),
            accessor: 'updated_at',
            Cell: DateTimeCell,
        },
        {
            Header: formatMessage(MESSAGES.deleted_at),
            accessor: 'deleted_at',
            Cell: DateTimeCell,
        },
        {
            Header: formatMessage(MESSAGES.actions),
            accessor: 'actions',
            resizable: false,
            sortable: false,
            width: 300,
            Cell: settings => (
                <section>
                    <IconButtonComponent
                        onClick={() => restoreForm(settings.row.original.id)}
                        icon="restore-from-trash"
                        tooltipMessage={MESSAGES.restoreFormTooltip}
                    />
                </section>
            ),
        },
    ];
    if (!hasPermission) {
        columns.pop();
    }
    return columns;
};
export default archivedTableColumn;