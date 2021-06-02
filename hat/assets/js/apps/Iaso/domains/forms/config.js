import React from 'react';
import moment from 'moment';
import { Grid } from '@material-ui/core';
import { Link } from 'react-router';

import {
    textPlaceholder,
    IconButton as IconButtonComponent,
    ColumnText as ColumnTextComponent,
} from 'bluesquare-components';
import FormVersionsDialog from './components/FormVersionsDialogComponent';
import { baseUrls } from '../../constants/urls';
import { getOrgUnitParentsIds } from '../orgUnits/utils';

import MESSAGES from './messages';
import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';

export const formVersionsTableColumns = (
    formatMessage,
    setForceRefresh,
    formId,
    periodType,
) => [
    {
        Header: formatMessage(MESSAGES.version),
        accessor: 'version_id',
        Cell: settings => (
            <ColumnTextComponent
                text={settings.original.version_id || textPlaceholder}
            />
        ),
    },
    {
        Header: formatMessage(MESSAGES.startPeriod),
        accessor: 'start_period',
        Cell: settings => (
            <ColumnTextComponent
                text={settings.original.start_period || textPlaceholder}
            />
        ),
    },
    {
        Header: formatMessage(MESSAGES.endPeriod),
        accessor: 'end_period',
        Cell: settings => (
            <ColumnTextComponent
                text={settings.original.end_period || textPlaceholder}
            />
        ),
    },
    {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        sortable: false,
        Cell: settings => (
            <section>
                {settings.original.xls_file && (
                    <IconButtonComponent
                        onClick={() =>
                            window.open(settings.original.xls_file, '_blank')
                        }
                        icon="xls"
                        tooltipMessage={MESSAGES.xls_form_file}
                    />
                )}
                <FormVersionsDialog
                    renderTrigger={({ openDialog }) => (
                        <IconButtonComponent
                            onClick={openDialog}
                            icon="edit"
                            tooltipMessage={MESSAGES.edit}
                        />
                    )}
                    onConfirmed={() => setForceRefresh(true)}
                    formVersion={settings.original}
                    periodType={periodType}
                    formId={formId}
                    titleMessage={{
                        ...MESSAGES.updateFormVersion,
                        values: {
                            version_id: settings.original.version_id,
                        },
                    }}
                    key={settings.original.updated_at}
                />
            </section>
        ),
    },
];

const formsTableColumns = (
    formatMessage,
    component,
    showEditAction = true,
    showMappingAction = true,
    deleteForm = null,
) => [
    {
        Header: formatMessage(MESSAGES.name),
        accessor: 'name',
        Cell: settings => <ColumnTextComponent text={settings.original.name} />,
    },
    {
        Header: formatMessage(MESSAGES.created_at),
        accessor: 'created_at',
        Cell: settings => (
            <ColumnTextComponent
                text={moment
                    .unix(settings.original.created_at)
                    .format('DD/MM/YYYY HH:mm')}
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
                    .format('DD/MM/YYYY HH:mm')}
            />
        ),
    },
    {
        Header: formatMessage(MESSAGES.instance_updated_at),
        accessor: 'instance_updated_at',
        Cell: settings => {
            const dateText = settings.original.instance_updated_at
                ? moment
                      .unix(settings.original.instance_updated_at)
                      .format('DD/MM/YYYY HH:mm')
                : textPlaceholder;

            return <ColumnTextComponent text={dateText} />;
        },
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
        Header: formatMessage(MESSAGES.form_id),
        sortable: false,
        Cell: settings => (
            <ColumnTextComponent
                text={settings.original.form_id || textPlaceholder}
            />
        ),
    },
    {
        Header: formatMessage(MESSAGES.latest_version_files),
        sortable: false,
        Cell: settings =>
            settings.original.latest_form_version !== null && (
                <Grid container spacing={1} justify="center">
                    <Grid item>
                        <ColumnTextComponent
                            text={
                                settings.original.latest_form_version.version_id
                            }
                        />
                    </Grid>
                    <Grid container spacing={1} justify="center">
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
        Header: formatMessage(MESSAGES.actions),
        resizable: false,
        sortable: false,
        width: 215,
        Cell: settings => {
            let urlToInstances = `${baseUrls.instances}/formId/${settings.original.id}`;
            if (
                component &&
                component.state &&
                component.state.currentOrgUnit !== undefined
            ) {
                const parentIds = getOrgUnitParentsIds(
                    component.state.currentOrgUnit,
                );
                parentIds.push(component.state.currentOrgUnit.id);
                urlToInstances += `/levels/${parentIds.join(',')}`;
            }

            return (
                <section>
                    <IconButtonComponent
                        url={`${urlToInstances}`}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.viewInstances}
                    />
                    {showEditAction && (
                        <IconButtonComponent
                            url={`${baseUrls.formDetail}/formId/${settings.original.id}`}
                            icon="edit"
                            tooltipMessage={MESSAGES.edit}
                        />
                    )}
                    {showMappingAction && (
                        <IconButtonComponent
                            url={`/forms/mappings/formId/${settings.original.id}/order/form_version__form__name,form_version__version_id,mapping__mapping_type/pageSize/20/page/1`}
                            icon="dhis"
                            tooltipMessage={MESSAGES.dhis2Mappings}
                        />
                    )}
                    <DeleteDialog
                        titleMessage={MESSAGES.deleteFormTitle}
                        message={MESSAGES.deleteFormText}
                        onConfirm={closeDialog =>
                            deleteForm(settings.original.id).then(closeDialog)
                        }
                    />
                </section>
            );
        },
    },
];

export default formsTableColumns;
