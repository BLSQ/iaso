import React from 'react';
import moment from 'moment';
import Link from '@material-ui/core/Link';
import Checkbox from '@material-ui/core/Checkbox';
import { Box } from '@material-ui/core';

import {
    LoadingSpinner,
    formatThousand,
    textPlaceholder,
    Expander,
} from 'bluesquare-components';

import getDisplayName from '../../utils/usersUtils';

import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import StarsComponent from '../../components/stars/StarsComponent';

import MESSAGES from './messages';

export const linksTableColumns = (formatMessage, validateLink) => [
    {
        Header: formatMessage(MESSAGES.similarityScore),
        width: 170,
        align: 'center',
        accessor: 'similarity_score',
        Cell: settings => {
            return (
                <Box display="flex" justifyContent="center">
                    <StarsComponent
                        score={settings.row.original.similarity_score}
                        bgColor={settings.row.index % 2 ? 'white' : '#f7f7f7'}
                        displayCount
                    />
                </Box>
            );
        },
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
        accessor: 'source__source',
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
        accessor: 'destination__source',
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
        Cell: settings => (
            <span>
                {moment.unix(settings.row.original.updated_at).format('LTS')}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.algorithm),
        accessor: 'algorithm_run',
        Cell: settings =>
            settings.row.original.algorithm_run
                ? settings.row.original.algorithm_run.algorithm.description
                : '?',
    },
    {
        Header: formatMessage(MESSAGES.validator),
        accessor: 'validator',
        Cell: settings =>
            settings.row.original.validator
                ? getDisplayName(settings.row.original.validator)
                : textPlaceholder,
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
                    moment.unix(settings.row.original.ended_at).format('LTS')
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
        Cell: settings => (
            <span>
                {moment.unix(settings.row.original.created_at).format('LTS')}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.name),
        accessor: 'algorithm__name',
        Cell: settings => (
            <span>{settings.row.original.algorithm.description}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.launcher),
        accessor: 'launcher',
        Cell: settings => (
            <span>
                {settings.row.original.launcher
                    ? getDisplayName(settings.row.original.launcher)
                    : textPlaceholder}
            </span>
        ),
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
