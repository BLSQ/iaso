import React from 'react';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { Tooltip } from '@material-ui/core';

import {
    IconButton as IconButtonComponent,
    textPlaceholder,
} from 'bluesquare-components';
import DataSourceDialogComponent from './components/DataSourceDialogComponent';
import MESSAGES from './messages';
import { AddTask } from './components/AddTaskComponent';
import { ImportGeoPkgDialog } from './components/ImportGeoPkgDialog';
import { VersionsDialog } from './components/VersionsDialog';

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
            defaultSourceVersion &&
            defaultSourceVersion.source &&
            defaultSourceVersion.source.id === settings.original.id && (
                <Tooltip title={formatMessage(MESSAGES.defaultSource)}>
                    <CheckCircleIcon color="primary" />
                </Tooltip>
            ),
    },
    {
        Header: formatMessage(MESSAGES.defaultVersion),
        accessor: 'default_version__number',
        Cell: settings => {
            if (!settings.original.default_version) return textPlaceholder;
            return <span>{settings.original.default_version.number}</span>;
        },
    },
    {
        Header: formatMessage(MESSAGES.dataSourceName),
        accessor: 'name',
        Cell: settings => {
            return <span>{settings.original.name}</span>;
        },
    },
    {
        Header: formatMessage(MESSAGES.dataSourceDescription),
        accessor: 'description',
        Cell: settings => <span>{settings.original.description}</span>,
    },
    {
        Header: formatMessage(MESSAGES.dataSourceReadOnly),
        accessor: 'read_only',
        Cell: settings => (
            <span>
                {settings.original.read_only === true
                    ? formatMessage(MESSAGES.yes)
                    : formatMessage(MESSAGES.no)}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.actions),
        resizable: false,
        sortable: false,
        Cell: settings => {
            const sortedVersions = settings.original.versions.sort(
                (v1, v2) => v2.number - v1.number,
            );
            const latestVersion =
                sortedVersions.length > 0 ? sortedVersions[0].number : 0;
            const addTaskTitle = {
                ...MESSAGES.addTaskTitle,
                values: {
                    title: formatMessage(MESSAGES.importFromDhis2),
                    source: settings.original.name,
                    version: latestVersion + 1,
                },
            };
            const defaultVersion =
                settings.original.default_version?.number ?? null;
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
                            ...settings.original,
                            projects: settings.original.projects.flat(),
                        }}
                        defaultSourceVersion={defaultSourceVersion}
                        titleMessage={MESSAGES.updateDataSource}
                        key={settings.original.updated_at}
                        onSuccess={() => setForceRefresh(true)}
                        sourceCredentials={
                            settings.original.credentials
                                ? settings.original.credentials
                                : {}
                        }
                    />
                    <VersionsDialog
                        renderTrigger={({ openDialog }) => (
                            <IconButtonComponent
                                onClick={openDialog}
                                icon="history" // FIXME replace by formatListNumberedIcon when merged in bluesquare
                                tooltipMessage={MESSAGES.versions}
                            />
                        )}
                        defaultSourceVersion={defaultSourceVersion}
                        source={settings.original}
                    />
                    <AddTask
                        renderTrigger={({ openDialog }) => (
                            <IconButtonComponent
                                onClick={openDialog}
                                icon="download"
                                tooltipMessage={MESSAGES.importFromDhis2}
                            />
                        )}
                        titleMessage={addTaskTitle}
                        key={`${settings.original.updated_at} ${settings.original.id} addTask`}
                        sourceId={settings.original.id}
                        sourceCredentials={
                            settings.original.credentials
                                ? settings.original.credentials
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
                        sourceId={settings.original.id}
                        sourceName={settings.original.name}
                        defaultVersion={defaultVersion}
                        projects={settings.original.projects.flat()}
                    />
                </section>
            );
        },
    },
];
export default dataSourcesTableColumns;
