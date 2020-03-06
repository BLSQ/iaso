import React from 'react';
import moment from 'moment';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';

import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import FormDialogComponent from '../../components/dialogs/FormDialogComponent';
import EditRowButtonComponent from '../../components/buttons/EditRowButtonComponent';
import ViewRowButtonComponent from '../../components/buttons/ViewRowButtonComponent';

const formsTableColumns = (formatMessage, component) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'iaso.forms.name',
            }),
            accessor: 'name',
            className: 'justify-left',
        },
        {
            Header: formatMessage({
                defaultMessage: 'Updated at',
                id: 'iaso.forms.updated_at',
            }),
            accessor: 'instance_updated_at',
            Cell: settings => (
                <section>
                    {settings.original.instance_updated_at
                        && moment.unix(settings.original.instance_updated_at).format('DD/MM/YYYY HH:mm')}
                    {!settings.original.instance_updated_at
                        && '/'}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Created at',
                id: 'iaso.forms.created_at',
            }),
            accessor: 'created_at',
            Cell: settings => (
                <section>
                    {moment.unix(settings.original.created_at).format('DD/MM/YYYY HH:mm')}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Type',
                id: 'iaso.forms.type',
            }),
            sortable: false,
            accessor: 'org_unit_types',
            Cell: settings => (
                <section>
                    {
                        settings.original.org_unit_types.map((o, index) => `${index > 0 ? ', ' : ''}${o.short_name}`)
                    }
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Record(s)',
                id: 'iaso.forms.records',
            }),
            accessor: 'instances_count',
            Cell: settings => (
                <section>
                    {settings.original.instances_count}
                </section>
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Latest version',
                id: 'iaso.forms.latest_verision_files',
            }),
            sortable: false,
            Cell: settings => (
                settings.original.latest_form_version !== null
                  && (
                      <Grid container spacing={1} justify="center">
                          <Grid item>{settings.original.latest_form_version.version_id}</Grid>
                          {
                              settings.original.latest_form_version.xls_file
                            && (
                                <Grid item>
                                    <Link download href={settings.original.latest_form_version.xls_file}>XLS</Link>
                                </Grid>
                            )
                          }
                          <Grid item>
                              <Link download href={settings.original.latest_form_version.file}>XML</Link>
                          </Grid>
                      </Grid>
                  )
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Action(s)',
                id: 'iaso.forms.actions',
            }),
            resizable: false,
            width: 250,
            sortable: false,
            Cell: settings => (
                <section>
                    {
                        settings.original.instances_count > 0
                        && (
                            <ViewRowButtonComponent onClick={() => component.selectForm(settings.original)} />
                        )
                    }
                    <FormDialogComponent
                        renderTrigger={({ openDialog }) => <EditRowButtonComponent onClick={openDialog} />}
                        onSuccess={() => component.setState({ isUpdated: true })}
                        initialData={settings.original}
                        titleMessage={{ id: 'iaso.forms.update', defaultMessage: 'Update form' }}
                        key={settings.original.updated_at}
                    />
                    {
                        // TODO: deactivated, hard delete is too dangerous - to discuss
                        false && (
                            <DeleteDialog
                                disabled={settings.original.instances_count > 0}
                                titleMessage={{
                                    id: 'iaso.forms.dialog.deleteFormTitle',
                                    defaultMessage: 'Are you sure you want to delete this form?',
                                }}
                                message={{
                                    id: 'iaso.forms.dialog.deleteFormText',
                                    defaultMessage: 'This operation cannot be undone.',
                                }}
                                onConfirm={closeDialog => component.deleteForm(settings.original).then(closeDialog)}
                            />
                        )
                    }
                </section>
            ),
        },
    ]
);
export default formsTableColumns;
