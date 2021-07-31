import React from 'react';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import { Tooltip } from '@material-ui/core';

import {
    IconButton as IconButtonComponent,
    textPlaceholder,
} from 'bluesquare-components';
import DataSourceDialogComponent from './components/DataSourceDialogComponent';
import MESSAGES from './messages';
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
                </section>
            );
        },
    },
];
export default dataSourcesTableColumns;
