import React, { useMemo } from 'react';
import {
    Column,
    LinkWithLocation,
    LoadingSpinner,
    displayDateFromTimestamp,
    formatThousand,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import { DateTimeCell } from '../../../components/Cells/DateTimeCell';
import getDisplayName from '../../../utils/usersUtils';
import { MESSAGES } from '../messages';
import { baseUrls } from '../../../constants/urls';
import DeleteDialog from '../../../components/dialogs/DeleteDialogComponent';
import { useDeleteRun } from './api/useDeleteRun';

export const useRunsTableColumns = (): Column[] => {
    const { formatMessage } = useSafeIntl();
    const { mutateAsync: deleteRun } = useDeleteRun();
    return useMemo(
        () => [
            {
                Header: formatMessage(MESSAGES.endedAt),
                accessor: 'ended_at',
                Cell: settings => (
                    <span>
                        {settings.row.original.ended_at ? (
                            displayDateFromTimestamp(settings.value)
                        ) : (
                            <LoadingSpinner
                                fixed={false}
                                transparent
                                padding={4}
                                size={25}
                            />
                        )}
                    </span>
                ),
            },
            {
                Header: formatMessage(MESSAGES.launchedAt),
                accessor: 'created_at',
                Cell: DateTimeCell,
            },
            {
                Header: formatMessage(MESSAGES.name),
                id: 'algorithm__name',
                accessor: row => row.algorithm.description,
            },
            {
                Header: formatMessage(MESSAGES.launcher),
                accessor: 'launcher',
                Cell: settings =>
                    settings.value
                        ? getDisplayName(settings.value)
                        : textPlaceholder,
            },
            {
                Header: formatMessage(MESSAGES.links),
                accessor: 'links_count',
                sortable: false,
                Cell: settings => (
                    <span>
                        {settings.row.original.links_count === 0 &&
                            textPlaceholder}
                        {settings.row.original.links_count > 0 && (
                            <LinkWithLocation
                                // size="small"
                                to={`/${baseUrls.links}/algorithmRunId/${settings.row.original.id}/searchActive/true`}
                            >
                                {formatThousand(
                                    settings.row.original.links_count,
                                )}
                            </LinkWithLocation>
                        )}
                    </span>
                ),
            },
            {
                Header: formatMessage(MESSAGES.origin),
                id: 'version_1',
                accessor: 'source',
                Cell: settings => (
                    <span>
                        {`${formatMessage(MESSAGES.source)}: ${
                            settings.row.original.source.data_source.name
                        }`}
                        <br />
                        {`${formatMessage(MESSAGES.version)}: ${
                            settings.row.original.source.number
                        }`}
                    </span>
                ),
            },
            {
                Header: formatMessage(MESSAGES.destination),
                id: 'version_2',
                accessor: 'destination',
                Cell: settings => (
                    <span>
                        {`${formatMessage(MESSAGES.source)}: ${
                            settings.row.original.destination.data_source.name
                        }`}
                        <br />
                        {`${formatMessage(MESSAGES.version)}: ${
                            settings.row.original.destination.number
                        }`}
                    </span>
                ),
            },
            {
                resizable: false,
                accessor: 'action',
                sortable: false,
                width: 100,
                Cell: settings => (
                    <section>
                        <DeleteDialog
                            disabled={Boolean(!settings.row.original.ended_at)}
                            titleMessage={MESSAGES.deleteRunTitle}
                            message={MESSAGES.deleteRunText}
                            onConfirm={closeDialog =>
                                deleteRun(settings.row.original.id).then(
                                    closeDialog,
                                )
                            }
                        />
                    </section>
                ),
            },
        ],
        [deleteRun, formatMessage],
    );
};
