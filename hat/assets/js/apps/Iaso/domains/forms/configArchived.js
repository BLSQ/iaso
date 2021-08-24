import React from 'react';
import moment from 'moment';
import { Grid } from '@material-ui/core';
import { Link } from 'react-router';
import {
    textPlaceholder,
    IconButton as IconButtonComponent,
} from 'bluesquare-components';
import MESSAGES from './messages';

const archivedTableColumn = (formatMessage, restoreForm) => [
    {
        Header: formatMessage(MESSAGES.name),
        accessor: 'name',
        Cell: settings => settings.cell.row.original.name,
    },
    {
        Header: formatMessage(MESSAGES.form_id),
        sortable: false,
        Cell: settings => settings.cell.row.original.form_id || textPlaceholder,
    },
    {
        Header: formatMessage(MESSAGES.type),
        sortable: false,
        accessor: 'org_unit_types',
        Cell: settings =>
            settings.cell.row.original.org_unit_types
                .map(o => o.short_name)
                .join(', '),
    },
    {
        Header: formatMessage(MESSAGES.records),
        accessor: 'instances_count',
        Cell: settings => settings.cell.row.original.instances_count,
    },
    {
        Header: formatMessage(MESSAGES.latest_version_files),
        sortable: false,
        Cell: settings =>
            settings.cell.row.original.latest_form_version !== null && (
                <Grid container spacing={1} justifyContent="center">
                    <Grid item>
                        {
                            settings.cell.row.original.latest_form_version
                                .version_id
                        }
                    </Grid>
                    <Grid container spacing={1} justifyContent="center">
                        {settings.cell.row.original.latest_form_version
                            .xls_file && (
                            <Grid item>
                                <Link
                                    download
                                    href={
                                        settings.cell.row.original
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
                                    settings.cell.row.original
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
        Cell: settings =>
            moment.unix(settings.cell.row.original.created_at).format('LTS'),
    },
    {
        Header: formatMessage(MESSAGES.updated_at),
        accessor: 'updated_at',
        Cell: settings =>
            moment.unix(settings.cell.row.original.updated_at).format('LTS'),
    },
    {
        Header: formatMessage(MESSAGES.deleted_at),
        accessor: 'deleted_at',
        Cell: settings =>
            moment.unix(settings.cell.row.original.deleted_at).format('LTS'),
    },
    {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        resizable: false,
        sortable: false,
        width: 300,
        Cell: settings => {
            return (
                <section>
                    <IconButtonComponent
                        onClick={() =>
                            restoreForm(settings.cell.row.original.id)
                        }
                        icon="restore-from-trash"
                        tooltipMessage={MESSAGES.restoreFormTooltip}
                    />
                </section>
            );
        },
    },
];
export default archivedTableColumn;
