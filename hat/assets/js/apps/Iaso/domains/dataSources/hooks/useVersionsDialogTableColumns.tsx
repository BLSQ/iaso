import React, { useMemo } from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Tooltip } from '@mui/material';
import { Column, IconButton, useSafeIntl } from 'bluesquare-components';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import { AddTask } from '../components/AddTaskComponent';
import { CopySourceVersion } from '../components/CopySourceVersion/CopySourceVersion';
import { EditSourceVersion } from '../components/EditSourceVersion';
import { ImportGeoPkgDialog } from '../components/ImportGeoPkgDialog';
import MESSAGES from '../messages';

export const useVersionsDialogTableColumns = (source): Column[] => {
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
                    ) : null;
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
                        </>
                    );
                },
            },
        ],
        [
            formatMessage,
            source.credentials,
            source.default_version?.id,
            source.id,
            source.name,
            source.read_only,
        ],
    );
};
