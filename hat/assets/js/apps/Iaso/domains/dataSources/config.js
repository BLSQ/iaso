import React, { useMemo } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
// eslint-disable-next-line import/no-named-as-default-member,import/no-named-as-default
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import { Tooltip } from '@mui/material';
import {
    IconButton,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import { DateTimeCell } from '../../components/Cells/DateTimeCell.tsx';
import { YesNoCell } from '../../components/Cells/YesNoCell';
import { DisplayIfUserHasPerm } from '../../components/DisplayIfUserHasPerm.tsx';
import { baseUrls } from '../../constants/urls.ts';
import * as Permission from '../../utils/permissions.ts';
import { DataSourceDialogComponent as DataSourceDialog } from './components/DataSourceDialogComponent';
import { ExportToDHIS2Dialog } from './components/ExportToDHIS2Dialog.tsx';
import { VersionsDialog } from './components/VersionsDialog';
import MESSAGES from './messages';

export const useDataSourcesTableColumns = defaultSourceVersion => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.dataSourceName),
                accessor: 'name',
            },
            {
                Header: formatMessage(MESSAGES.defaultSource),
                accessor: 'defaultSource',
                sortable: false,
                Cell: settings => {
                    if (
                        defaultSourceVersion?.source?.id ===
                        settings.row.original.id
                    ) {
                        return (
                            <Tooltip
                                title={formatMessage(MESSAGES.defaultSource)}
                            >
                                <CheckCircleIcon color="primary" />
                            </Tooltip>
                        );
                    }
                    // null or empty string will make TS compiler complain
                    return <span />;
                },
            },
            {
                Header: formatMessage(MESSAGES.projects),
                accessor: 'projects',
                sortable: false,
                Cell: settings => {
                    const projects = settings.row.original.projects.flat();
                    if (!projects) {
                        return textPlaceholder;
                    }
                    const projectNames = [];
                    projects.forEach(project => {
                        projectNames.push(project.name);
                    });
                    return projectNames.join(', ');
                },
            },
            {
                Header: formatMessage(MESSAGES.dataSourceDescription),
                accessor: 'description',
            },
            {
                Header: formatMessage(MESSAGES.dataSourceReadOnly),
                accessor: 'read_only',
                Cell: YesNoCell,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                resizable: false,
                sortable: false,
                Cell: settings => {
                    return (
                        <section>
                            <IconButton
                                url={`/${baseUrls.sourceDetails}/sourceId/${settings.row.original.id}`}
                                icon="remove-red-eye"
                                tooltipMessage={MESSAGES.viewDataSource}
                            />

                            <DisplayIfUserHasPerm
                                permissions={[Permission.SOURCE_WRITE]}
                            >
                                <DataSourceDialog
                                    renderTrigger={({ openDialog }) => (
                                        <IconButton
                                            dataTestId={`datasource-dialog-button-${settings.row.original.id}`}
                                            onClick={openDialog}
                                            icon="edit"
                                            tooltipMessage={MESSAGES.edit}
                                        />
                                    )}
                                    initialData={{
                                        ...settings.row.original,
                                        projects:
                                            settings.row.original.projects.flat(),
                                    }}
                                    defaultSourceVersion={defaultSourceVersion}
                                    key={settings.row.original.updated_at}
                                    sourceCredentials={
                                        settings.row.original.credentials
                                            ? settings.row.original.credentials
                                            : {}
                                    }
                                />
                                <VersionsDialog
                                    renderTrigger={({ openDialog }) => (
                                        <IconButton
                                            dataTestId={`open-versions-dialog-button-${settings.row.original.id}`}
                                            onClick={openDialog}
                                            overrideIcon={
                                                FormatListNumberedIcon
                                            }
                                            tooltipMessage={MESSAGES.versions}
                                        />
                                    )}
                                    defaultSourceVersion={defaultSourceVersion}
                                    source={settings.row.original}
                                />
                                <ExportToDHIS2Dialog
                                    dataSourceName={settings.row.original.name}
                                    dataSourceId={settings.row.original.id}
                                    versions={settings.row.original.versions}
                                    defaultVersionId={
                                        settings.row.original?.default_version
                                            ?.id
                                    }
                                />
                            </DisplayIfUserHasPerm>
                        </section>
                    );
                },
            },
        ],
        [defaultSourceVersion, formatMessage],
    );
};

export const useSourceVersionsTableColumns = source => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.defaultVersion),
                accessor: 'id',
                sortable: false,
                Cell: settings => {
                    if (source.default_version?.id === settings.value) {
                        return (
                            <Tooltip
                                title={formatMessage(MESSAGES.defaultVersion)}
                            >
                                <CheckCircleIcon color="primary" />
                            </Tooltip>
                        );
                    }
                    // null or empty string will make TS compiler complain
                    return <span />;
                },
            },
            {
                Header: formatMessage({
                    id: 'iaso.versionsDialog.label.number',
                    defaultMessage: 'Number',
                }),
                sortable: true,
                accessor: 'number',
            },
            {
                Header: formatMessage({
                    id: 'iaso.versionsDialog.label.createdAt',
                    defaultMessage: 'Created',
                }),
                accessor: 'created_at',
                sortable: false,
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage({
                    id: 'iaso.versionsDialog.label.updatedAt',
                    defaultMessage: 'Updated',
                }),
                accessor: 'updated_at',
                sortable: false,
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage({
                    id: 'iaso.label.orgUnit',
                    defaultMessage: 'Org units',
                }),
                accessor: 'org_units_count',
            },
            {
                Header: formatMessage({
                    id: 'iaso.versionsDialog.label.description',
                    defaultMessage: 'Description',
                }),
                accessor: 'description',
                sortable: false,
            },
        ],
        [formatMessage, source?.default_version?.id],
    );
};
