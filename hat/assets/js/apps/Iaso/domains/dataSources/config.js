import React from 'react';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { Tooltip } from '@material-ui/core';

// eslint-disable-next-line import/no-named-as-default
// eslint-disable-next-line import/no-named-as-default-member
import {
    IconButton as IconButtonComponent,
    textPlaceholder,
} from 'bluesquare-components';
import DataSourceDialogComponent from './components/DataSourceDialogComponent';
import MESSAGES from './messages';
import { AddTask } from './components/AddTaskComponent';

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
                id: 'addAskTitle',
                defaultMessage: `${formatMessage(
                    MESSAGES.importFromDhis2,
                )} - Source: ${settings.original.name} - Version: ${
                    latestVersion + 1
                }`,
            };

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
                        key={`${settings.original.updated_at} ${settings.original.id} addTask`}
                        sourceId={settings.original.id}
                        sourceVersion={latestVersion + 1}
                        sourceCredentials={
                            settings.original.credentials
                                ? settings.original.credentials
                                : {}
                        }
                    />
                </section>
            );
        },
    },
];
export default dataSourcesTableColumns;
