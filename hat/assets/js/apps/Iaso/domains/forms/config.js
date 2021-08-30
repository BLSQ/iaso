import React from 'react';
import moment from 'moment';
import { Grid } from '@material-ui/core';
import { Link } from 'react-router';

import {
    textPlaceholder,
    IconButton as IconButtonComponent,
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
        Cell: settings => settings.row.original.version_id || textPlaceholder,
    },
    {
        Header: formatMessage(MESSAGES.startPeriod),
        accessor: 'start_period',
        Cell: settings => settings.row.original.start_period || textPlaceholder,
    },
    {
        Header: formatMessage(MESSAGES.endPeriod),
        accessor: 'end_period',
        Cell: settings => settings.row.original.end_period || textPlaceholder,
    },
    {
        Header: formatMessage(MESSAGES.actions),
        accessor: 'actions',
        sortable: false,
        Cell: settings => (
            <section>
                {settings.row.original.xls_file && (
                    <IconButtonComponent
                        onClick={() =>
                            window.open(
                                settings.row.original.xls_file,
                                '_blank',
                            )
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
                    formVersion={settings.row.original}
                    periodType={periodType}
                    formId={formId}
                    titleMessage={{
                        ...MESSAGES.updateFormVersion,
                        values: {
                            version_id: settings.row.original.version_id,
                        },
                    }}
                    key={settings.row.original.updated_at}
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
        style: { justifyContent: 'left' },
        Cell: settings => settings.row.original.name,
    },
    {
        Header: formatMessage(MESSAGES.created_at),
        accessor: 'created_at',
        Cell: settings =>
            moment.unix(settings.row.original.created_at).format('LTS'),
    },
    {
        Header: formatMessage(MESSAGES.updated_at),
        accessor: 'updated_at',
        Cell: settings =>
            moment.unix(settings.row.original.updated_at).format('LTS'),
    },
    {
        Header: formatMessage(MESSAGES.instance_updated_at),
        accessor: 'instance_updated_at',
        Cell: settings => {
            const dateText = settings.row.original.instance_updated_at
                ? moment
                      .unix(settings.row.original.instance_updated_at)
                      .format('LTS')
                : textPlaceholder;

            return dateText;
        },
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
        Cell: settings => settings.row.original.instances_count,
    },
    {
        Header: formatMessage(MESSAGES.form_id),
        accessor: 'form_id',
        sortable: false,
        style: { justifyContent: 'left' },
        Cell: settings => settings.row.original.form_id || textPlaceholder,
    },
    {
        Header: formatMessage(MESSAGES.latest_version_files),
        accessor: 'latest_version_files',
        sortable: false,
        Cell: settings =>
            settings.row.original.latest_form_version !== null && (
                <Grid container spacing={1} justifyContent="center">
                    <Grid item>
                        {settings.row.original.latest_form_version.version_id}
                    </Grid>
                    <Grid container spacing={1} justifyContent="center">
                        {settings.row.original.latest_form_version.xls_file && (
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
                                    settings.row.original.latest_form_version
                                        .file
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
        width: 250,
        accessor: 'actions',
        Cell: settings => {
            let urlToInstances = `${baseUrls.instances}/formId/${settings.row.original.id}`;
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
                            url={`${baseUrls.formDetail}/formId/${settings.row.original.id}`}
                            icon="edit"
                            tooltipMessage={MESSAGES.edit}
                        />
                    )}
                    {showMappingAction && (
                        <IconButtonComponent
                            url={`/forms/mappings/formId/${settings.row.original.id}/order/form_version__form__name,form_version__version_id,mapping__mapping_type/pageSize/20/page/1`}
                            icon="dhis"
                            tooltipMessage={MESSAGES.dhis2Mappings}
                        />
                    )}
                    <DeleteDialog
                        titleMessage={MESSAGES.deleteFormTitle}
                        message={MESSAGES.deleteFormText}
                        onConfirm={closeDialog =>
                            deleteForm(settings.row.original.id).then(
                                closeDialog,
                            )
                        }
                    />
                </section>
            );
        },
    },
];

export default formsTableColumns;
