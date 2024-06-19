import React, { useMemo } from 'react';
import Checkbox from '@mui/material/Checkbox';
import { Box } from '@mui/material';
import { useSafeIntl, Expander } from 'bluesquare-components';
import getDisplayName from '../../utils/usersUtils';
import { StarsComponent } from '../../components/stars/StarsComponent';
import { DateTimeCell } from '../../components/Cells/DateTimeCell';
import MESSAGES from './messages';

export const useLinksTableColumns = validateLink => {
    const { formatMessage } = useSafeIntl();
    return useMemo(
        () => [
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
                    row.algorithm_run
                        ? row.algorithm_run.algorithm.description
                        : '-',
            },
            {
                Header: formatMessage(MESSAGES.validator),
                accessor: 'validator',
                Cell: settings =>
                    settings.value && getDisplayName(settings.value),
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
        ],
        [formatMessage, validateLink],
    );
};
