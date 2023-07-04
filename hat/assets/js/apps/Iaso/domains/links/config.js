import React from 'react';
import Link from '@material-ui/core/Link';
import Checkbox from '@material-ui/core/Checkbox';
import { Box } from '@material-ui/core';

import {
    LoadingSpinner,
    formatThousand,
    textPlaceholder,
    Expander,
    displayDateFromTimestamp,
} from 'bluesquare-components';

import getDisplayName from '../../utils/usersUtils.ts';

import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import { StarsComponent } from '../../components/stars/StarsComponent.tsx';

import MESSAGES from './messages';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';

export const linksTableColumns = (formatMessage, validateLink) => [
    {
        Header: formatMessage(MESSAGES.similarityScore),
        width: 170,
        align: 'center',
        accessor: 'similarity_score',
        Cell: settings => (
            <Box display="flex" justifyContent="center">
                <StarsComponent
                    maxScore={100}
                    displayCount
                    score={settings.row.original.similarity_score}
                />
            </Box>
        ),
    },
    {
        Header: formatMessage(MESSAGES.name),
        accessor: 'destination__name',
        Cell: settings => (
            <span>
                {settings.row.original.destination.name} /{' '}
                {settings.row.original.source.name}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.origin),
        accessor: 'source__version',
        Cell: settings => (
            <span>
                {`${formatMessage(MESSAGES.source)}: ${
                    settings.row.original.source.source
                }`}
                <br />
                {`${formatMessage(MESSAGES.version)}: ${
                    settings.row.original.source.version
                }`}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.destination),
        accessor: 'destination__version',
        Cell: settings => (
            <span>
                {`${formatMessage(MESSAGES.source)}: ${
                    settings.row.original.destination.source
                }`}
                <br />
                {`${formatMessage(MESSAGES.version)}: ${
                    settings.row.original.destination.version
                }`}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        Cell: DateTimeCell,
    },
    {
        Header: formatMessage(MESSAGES.algorithm),
        id: 'algorithm_run',
        accessor: row =>
            row.algorithm_run ? row.algorithm_run.algorithm.description : '-',
    },
    {
        Header: formatMessage(MESSAGES.validator),
        accessor: 'validator',
        Cell: settings => settings.value && getDisplayName(settings.value),
    },
    {
        Header: formatMessage(MESSAGES.validated),
        accessor: 'validated',
        Cell: settings => (
            <Checkbox
                color="primary"
                checked={settings.row.original.validated}
                onChange={() => validateLink(settings.row.original)}
                value="checked"
            />
        ),
    },
    {
        expander: true,
        accessor: 'expander',
        width: 65,
        Expander,
    },
];

export const runsTableColumns = (
    formatMessage,
    onSelectRunLinks,
    deleteRuns,
) => [
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
            settings.value ? getDisplayName(settings.value) : textPlaceholder,
    },
    {
        Header: formatMessage(MESSAGES.links),
        accessor: 'links_count',
        sortable: false,
        Cell: settings => (
            <span>
                {settings.row.original.links_count === 0 && textPlaceholder}
                {settings.row.original.links_count > 0 && (
                    <Link
                        size="small"
                        onClick={() => onSelectRunLinks(settings.row.original)}
                    >
                        {formatThousand(settings.row.original.links_count)}
                    </Link>
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
                        deleteRuns(settings.row.original).then(closeDialog)
                    }
                />
            </section>
        ),
    },
];
