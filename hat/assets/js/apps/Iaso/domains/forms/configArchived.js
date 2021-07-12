import React from 'react';
import moment from 'moment';
import { Grid } from '@material-ui/core';
import { Link } from 'react-router';
import {
    textPlaceholder,
    IconButton as IconButtonComponent,
    ColumnText as ColumnTextComponent,
} from 'bluesquare-components';
import MESSAGES from './messages';
import { getDisplayedDateHourFormat } from '../../utils/dates';

const archivedTableColumn = (formatMessage, restoreForm) => [
    {
        Header: formatMessage(MESSAGES.name),
        accessor: 'name',
        Cell: settings => <ColumnTextComponent text={settings.original.name} />,
    },
    {
        Header: formatMessage(MESSAGES.form_id),
        sortable: false,
        Cell: settings => (
            <ColumnTextComponent
                text={settings.original.form_id || textPlaceholder}
            />
        ),
    },
    {
        Header: formatMessage(MESSAGES.type),
        sortable: false,
        accessor: 'org_unit_types',
        Cell: settings => (
            <ColumnTextComponent
                text={settings.original.org_unit_types
                    .map(o => o.short_name)
                    .join(', ')}
            />
        ),
    },
    {
        Header: formatMessage(MESSAGES.records),
        accessor: 'instances_count',
        Cell: settings => (
            <ColumnTextComponent text={settings.original.instances_count} />
        ),
    },
    {
        Header: formatMessage(MESSAGES.latest_version_files),
        sortable: false,
        Cell: settings =>
            settings.original.latest_form_version !== null && (
                <Grid container spacing={1} justifyContent="center">
                    <Grid item>
                        <ColumnTextComponent
                            text={
                                settings.original.latest_form_version.version_id
                            }
                        />
                    </Grid>
                    <Grid container spacing={1} justifyContent="center">
                        {settings.original.latest_form_version.xls_file && (
                            <Grid item>
                                <Link
                                    download
                                    href={
                                        settings.original.latest_form_version
                                            .xls_file
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
                                    settings.original.latest_form_version.file
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
        Cell: settings => (
            <ColumnTextComponent
                text={moment
                    .unix(settings.original.created_at)
                    .format(getDisplayedDateHourFormat())}
            />
        ),
    },
    {
        Header: formatMessage(MESSAGES.updated_at),
        accessor: 'updated_at',
        Cell: settings => (
            <ColumnTextComponent
                text={moment
                    .unix(settings.original.updated_at)
                    .format(getDisplayedDateHourFormat())}
            />
        ),
    },
    {
        Header: formatMessage(MESSAGES.deleted_at),
        accessor: 'deleted_at',
        Cell: settings => (
            <ColumnTextComponent
                text={moment
                    .unix(settings.original.deleted_at)
                    .format(getDisplayedDateHourFormat())}
            />
        ),
    },
    {
        Header: formatMessage(MESSAGES.actions),
        resizable: false,
        sortable: false,
        width: 150,
        Cell: settings => {
            return (
                <section>
                    <IconButtonComponent
                        onClick={() => restoreForm(settings.original.id)}
                        icon="restore-from-trash"
                        tooltipMessage={MESSAGES.restoreFormTooltip}
                    />
                </section>
            );
        },
    },
];
export default archivedTableColumn;
