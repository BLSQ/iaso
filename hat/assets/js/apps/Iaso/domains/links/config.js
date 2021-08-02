import React from 'react';
import moment from 'moment';
import Link from '@material-ui/core/Link';
import Checkbox from '@material-ui/core/Checkbox';
import { Tooltip } from '@material-ui/core';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

import {
    LoadingSpinner,
    formatThousand,
    textPlaceholder,
} from 'bluesquare-components';
import getDisplayName from '../../utils/usersUtils';

import DeleteDialog from '../../components/dialogs/DeleteDialogComponent';
import StarsComponent from '../../components/stars/StarsComponent';

import MESSAGES from './messages';

export const linksTableColumns = (formatMessage, validateLink, classes) => [
    {
        Header: formatMessage(MESSAGES.similarityScore),
        width: 170,
        accessor: 'similarity_score',
        Cell: settings => (
            <div className="middle-align">
                <StarsComponent
                    score={settings.original.similarity_score}
                    bgColor={settings.index % 2 ? 'white' : '#f7f7f7'}
                    displayCount
                />
            </div>
        ),
    },
    {
        Header: formatMessage(MESSAGES.name),
        accessor: 'destination__name',
        Cell: settings => (
            <span>
                {settings.original.destination.name} /{' '}
                {settings.original.source.name}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.origin),
        accessor: 'source__source',
        Cell: settings => (
            <span>
                {`${formatMessage(MESSAGES.source)}: ${
                    settings.original.source.source
                }`}
                <br />
                {`${formatMessage(MESSAGES.version)}: ${
                    settings.original.source.version
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
                    settings.original.destination.source
                }`}
                <br />
                {`${formatMessage(MESSAGES.version)}: ${
                    settings.original.destination.version
                }`}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.updatedAt),
        accessor: 'updated_at',
        Cell: settings => (
            <span>
                {moment.unix(settings.original.updated_at).format('LTS')}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.algorithm),
        accessor: 'algorithm_run',
        Cell: settings =>
            settings.original.algorithm_run
                ? settings.original.algorithm_run.algorithm.description
                : '?',
    },
    {
        Header: formatMessage(MESSAGES.validator),
        accessor: 'validator',
        Cell: settings =>
            settings.original.validator
                ? getDisplayName(settings.original.validator)
                : textPlaceholder,
    },
    {
        Header: formatMessage(MESSAGES.validated),
        accessor: 'validated',
        Cell: settings => (
            <Checkbox
                color="primary"
                checked={settings.original.validated}
                onChange={() => validateLink(settings.original)}
                value="checked"
            />
        ),
    },
    {
        expander: true,
        width: 65,
        // eslint-disable-next-line react/prop-types
        Expander: ({ isExpanded }) =>
            isExpanded ? (
                <VisibilityOff />
            ) : (
                <Tooltip
                    classes={{
                        popper: classes.popperFixed,
                    }}
                    title={formatMessage(MESSAGES.details)}
                >
                    <Visibility />
                </Tooltip>
            ),
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
                {settings.original.ended_at ? (
                    moment.unix(settings.original.ended_at).format('LTS')
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
                {moment.unix(settings.original.created_at).format('LTS')}
            </span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.name),
        accessor: 'algorithm__name',
        Cell: settings => (
            <span>{settings.original.algorithm.description}</span>
        ),
    },
    {
        Header: formatMessage(MESSAGES.launcher),
        accessor: 'launcher',
        Cell: settings => (
            <span>
                {settings.original.launcher
                    ? getDisplayName(settings.original.launcher)
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
                {settings.original.links_count === 0 && textPlaceholder}
                {settings.original.links_count > 0 && (
                    <Link
                        size="small"
                        onClick={() => onSelectRunLinks(settings.original)}
                    >
                        {formatThousand(settings.original.links_count)}
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
                    settings.original.source.data_source.name
                }`}
                <br />
                {`${formatMessage(MESSAGES.version)}: ${
                    settings.original.source.number
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
                    settings.original.destination.data_source.name
                }`}
                <br />
                {`${formatMessage(MESSAGES.version)}: ${
                    settings.original.destination.number
                }`}
            </span>
        ),
    },
    {
        resizable: false,
        sortable: false,
        width: 100,
        Cell: settings => (
            <section>
                <DeleteDialog
                    disabled={Boolean(!settings.original.ended_at)}
                    titleMessage={MESSAGES.deleteRunTitle}
                    message={MESSAGES.deleteRunText}
                    onConfirm={closeDialog =>
                        deleteRuns(settings.original).then(closeDialog)
                    }
                />
            </section>
        ),
    },
];
