import React from 'react';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { Tooltip } from '@material-ui/core';

import { IconButton as IconButtonComponent } from 'bluesquare-components';
// eslint-disable-next-line import/no-named-as-default-member,import/no-named-as-default
import DataSourceDialogComponent from './components/DataSourceDialogComponent';
import MESSAGES from './messages';
import { AddTask } from './components/AddTaskComponent';
import { ImportGeoPkgDialog } from './components/ImportGeoPkgDialog';
import { YesNoCell } from '../../components/Cells/YesNoCell';

const dataSourcesTableColumns = (
    formatMessage,
    setForceRefresh,
    defaultSourceVersion,
) => [
    {
        Header: formatMessage(MESSAGES.defaultSource),
        accessor: 'defaultSource',
        sortable: false,
        Cell: settings =>
            defaultSourceVersion?.source?.id === settings.row.original.id && (
                <Tooltip title={formatMessage(MESSAGES.defaultSource)}>
                    <CheckCircleIcon color="primary" />
                </Tooltip>
            ),
    },
    {
        Header: formatMessage(MESSAGES.defaultVersion),
        id: 'default_version__number',
        accessor: row => row.default_version?.number,
    },
    {
        Header: formatMessage(MESSAGES.dataSourceName),
        accessor: 'name',
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
            const sortedVersions = settings.row.original.versions.sort(
                (v1, v2) => v2.number - v1.number,
            );
            const latestVersion =
                sortedVersions.length > 0 ? sortedVersions[0].number : 0;
            const addTaskTitle = {
                ...MESSAGES.addTaskTitle,
                values: {
                    title: formatMessage(MESSAGES.importFromDhis2),
                    source: settings.row.original.name,
                    version: latestVersion + 1,
                },
            };
            const defaultVersion =
                settings.row.original.default_version?.number ?? null;
            return (
                <section>
                    <DataSourceDialogComponent
                        renderTrigger={({ openDialog }) => (
                            <IconButtonComponent
                                onClick={openDialog}
                                icon="edit"
                                tooltipMessage={MESSAGES.edit}
                            />
                        )}
                        initialData={{
                            ...settings.row.original,
                            projects: settings.row.original.projects.flat(),
                        }}
                        defaultSourceVersion={defaultSourceVersion}
                        titleMessage={MESSAGES.updateDataSource}
                        key={settings.row.original.updated_at}
                        onSuccess={() => setForceRefresh(true)}
                        sourceCredentials={
                            settings.row.original.credentials
                                ? settings.row.original.credentials
                                : {}
                        }
                    />
                    <AddTask
                        renderTrigger={({ openDialog }) => (
                            <IconButtonComponent
                                onClick={openDialog}
                                icon="download"
                                tooltipMessage={MESSAGES.importFromDhis2}
                            />
                        )}
                        defaultSourceVersion={defaultSourceVersion}
                        titleMessage={addTaskTitle}
                        key={`${settings.row.original.updated_at} ${settings.row.original.id} addTask`}
                        sourceId={settings.row.original.id}
                        sourceVersion={latestVersion + 1}
                        sourceCredentials={
                            settings.row.original.credentials
                                ? settings.row.original.credentials
                                : {}
                        }
                    />
                    <ImportGeoPkgDialog
                        renderTrigger={({ openDialog }) => (
                            <IconButtonComponent
                                onClick={openDialog}
                                icon="globe"
                                tooltipMessage={MESSAGES.importGeoPkg}
                            />
                        )}
                        titleMessage={MESSAGES.geoPkgTitle}
                        sourceId={settings.row.original.id}
                        sourceName={settings.row.original.name}
                        latestVersion={latestVersion}
                        defaultVersion={defaultVersion}
                        projects={settings.row.original.projects.flat()}
                    />
                </section>
            );
        },
    },
];
export default dataSourcesTableColumns;
