import React, { useMemo } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import { Tooltip, IconButton as MuiIconButton, Link, Box } from '@mui/material';
import { Column, useSafeIntl, IconButton } from 'bluesquare-components';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import { AddTask } from '../components/AddTaskComponent';
import { CopySourceVersion } from '../components/CopySourceVersion/CopySourceVersion';
import { EditSourceVersion } from '../components/EditSourceVersion';
import { ImportGeoPkgDialog } from '../components/ImportGeoPkgDialog';
import MESSAGES from '../messages';

export const useVersionsDialogTableColumns = (
    source,
    hasDhis2Module,
): Column[] => {
    const { formatMessage } = useSafeIntl();

    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.defaultVersion),
                accessor: 'id',
                sortable: false,
                Cell: settings => {
                    return source.default_version?.id === settings.value ? (
                        <Tooltip title={formatMessage(MESSAGES.defaultVersion)}>
                            <CheckCircleIcon color="primary" />
                        </Tooltip>
                    ) : (
                        <></>
                    );
                },
            },
            {
                Header: formatMessage(MESSAGES.number),
                sortable: true,
                accessor: 'number',
            },
            {
                Header: formatMessage(MESSAGES.createdAt),
                accessor: 'created_at',
                sortable: false,
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.updatedAt),
                accessor: 'updated_at',
                sortable: false,
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.orgUnits),
                accessor: 'org_units_count',
            },
            {
                Header: formatMessage(MESSAGES.description),
                accessor: 'description',
                sortable: false,
            },
            {
                Header: formatMessage(MESSAGES.actions),
                accessor: 'actions',
                sortable: false,
                width: 200,
                Cell: settings => {
                    if (source.read_only) {
                        return <span>{formatMessage(MESSAGES.readOnly)}</span>;
                    }
                    const searches = [
                        {
                            version: settings.row.original.id,
                            validation_status: 'all',
                        },
                    ];

                    const encodedSearches = encodeURIComponent(
                        JSON.stringify(searches),
                    );

                    const gpkgUrl = `/api/orgunits/?searches=${encodedSearches}&gpkg=true`;

                    return (
                        <>
                            <EditSourceVersion
                                sourceVersionId={settings.row.original.id}
                                description={settings.row.original.description}
                                sourceVersionNumber={
                                    settings.row.original.number
                                }
                                dataSourceId={source.id}
                            />
                            {hasDhis2Module && (
                                <AddTask
                                    renderTrigger={({ openDialog }) => (
                                        <IconButton
                                            onClick={openDialog}
                                            icon="dhis"
                                            tooltipMessage={
                                                MESSAGES.updateFromDhis2
                                            }
                                        />
                                    )}
                                    sourceId={source.id}
                                    sourceVersionNumber={
                                        settings.row.original.number
                                    }
                                    sourceCredentials={source.credentials ?? {}}
                                />
                            )}
                            <ImportGeoPkgDialog
                                renderTrigger={({ openDialog }) => (
                                    <IconButton
                                        onClick={openDialog}
                                        icon="globe"
                                        tooltipMessage={MESSAGES.gpkgTooltip}
                                    />
                                )}
                                sourceId={source.id}
                                sourceName={source.name}
                                versionNumber={settings.row.original.number}
                            />
                            <CopySourceVersion
                                dataSourceId={source.id}
                                dataSourceVersionNumber={
                                    settings.row.original.number
                                }
                                dataSourceName={source.name}
                            />
                            <Tooltip
                                title={formatMessage(MESSAGES.downloadGpkg)}
                            >
                                <MuiIconButton size="small" sx={{ padding: 1 }}>
                                    <Link
                                        href={gpkgUrl}
                                        download
                                        lineHeight={0.6}
                                    >
                                        <DownloadIcon color="action" />
                                    </Link>
                                </MuiIconButton>
                            </Tooltip>
                        </>
                    );
                },
            },
        ],
        [
            formatMessage,
            hasDhis2Module,
            source.credentials,
            source.default_version?.id,
            source.id,
            source.name,
            source.read_only,
        ],
    );
};
