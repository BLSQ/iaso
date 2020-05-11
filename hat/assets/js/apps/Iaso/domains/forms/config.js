import React from 'react';
import moment from 'moment';
import Grid from '@material-ui/core/Grid';
import { Link } from 'react-router';

import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import FormDialogComponent from '../../components/dialogs/FormDialogComponent';
import IconButtonComponent from '../../components/buttons/IconButtonComponent';
import ColumnTextComponent from '../../components/tables/ColumnTextComponent';
import { textPlaceholder } from '../../constants/uiConstants';
import { baseUrls } from '../../constants/urls';


const formsTableColumns = (formatMessage, component) => (
    [
        {
            Header: formatMessage({
                defaultMessage: 'Name',
                id: 'iaso.forms.name',
            }),
            accessor: 'name',
            Cell: settings => <ColumnTextComponent text={settings.original.name} />,
        },
        {
            Header: formatMessage({
                defaultMessage: 'Updated at',
                id: 'iaso.forms.updated_at',
            }),
            accessor: 'instance_updated_at',
            Cell: (settings) => {
                const dateText = settings.original.instance_updated_at
                    ? moment.unix(settings.original.instance_updated_at).format('DD/MM/YYYY HH:mm')
                    : textPlaceholder;

                return <ColumnTextComponent text={dateText} />;
            },
        },
        {
            Header: formatMessage({
                defaultMessage: 'Created at',
                id: 'iaso.forms.created_at',
            }),
            accessor: 'created_at',
            Cell: settings => (
                <ColumnTextComponent text={moment.unix(settings.original.created_at).format('DD/MM/YYYY HH:mm')} />
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
                <ColumnTextComponent
                    text={settings.original.org_unit_types.map(o => o.short_name).join(', ')}
                />
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Record(s)',
                id: 'iaso.forms.records',
            }),
            accessor: 'instances_count',
            Cell: settings => (
                <ColumnTextComponent text={settings.original.instances_count} />
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Form id',
                id: 'iaso.forms.form_id',
            }),
            sortable: false,
            Cell: settings => (
                <ColumnTextComponent text={settings.original.form_id} />
            ),
        },
        {
            Header: formatMessage({
                defaultMessage: 'Latest version',
                id: 'iaso.forms.latest_version_files',
            }),
            sortable: false,
            Cell: settings => (
                settings.original.latest_form_version !== null
                  && (
                      <Grid container spacing={1} justify="center">
                          <Grid item>
                              <ColumnTextComponent text={settings.original.latest_form_version.version_id} />
                          </Grid>
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
                id: 'iaso.labels.actions',
            }),
            resizable: false,
            sortable: false,
            Cell: settings => (
                <section>
                    {
                        settings.original.instances_count > 0
                        && (
                            <IconButtonComponent
                                url={`${baseUrls.instances}/formId/${settings.original.id}`}
                                icon="remove-red-eye"
                                tooltipMessage={{ id: 'iaso.label.view', defaultMessage: 'View' }}
                            />
                        )
                    }

                    <FormDialogComponent
                        renderTrigger={({ openDialog }) => (
                            <IconButtonComponent
                                onClick={openDialog}
                                icon="edit"
                                tooltipMessage={{ id: 'iaso.label.edit', defaultMessage: 'Edit' }}
                            />
                        )}
                        onSuccess={() => component.setState({ isUpdated: true })}
                        initialData={settings.original}
                        titleMessage={{ id: 'iaso.forms.update', defaultMessage: 'Update form' }}
                        key={settings.original.updated_at}
                    />
                    <IconButtonComponent
                        url={`/forms/mappings/formId/${settings.original.id}/order/form_version__form__name,form_version__version_id,mapping__mapping_type/pageSize/20/page/1`}
                        icon="dhis"
                        tooltipMessage={{
                            id: 'iaso.label.dhis2Mappings',
                            defaultMessage: 'DHIS mappings',
                        }}
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
