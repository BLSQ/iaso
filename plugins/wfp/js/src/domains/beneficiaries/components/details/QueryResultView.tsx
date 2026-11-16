import React, { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { UseQueryResult } from 'react-query';
import MESSAGES from '../../messages';
import { details } from './styles';

// Loading and error states of a query, then its content
export function QueryResultView<T>({
    query,
    errorMessage,
    children,
}: {
    query: UseQueryResult<T>;
    errorMessage: string;
    children: (data: T) => ReactNode;
}) {
    const { formatMessage } = useSafeIntl();
    const { data, error, isLoading } = query;
    if (isLoading) {
        return (
            <Typography sx={{ p: 3 }} color="textSecondary">
                {formatMessage(MESSAGES.loading)}
            </Typography>
        );
    }
    if (error || !data) {
        return (
            <Typography sx={{ p: 3 }} color="error">
                {error
                    ? `${errorMessage}: ${(error as Error).message}`
                    : errorMessage}
            </Typography>
        );
    }
    return <Box sx={details.root}>{children(data)}</Box>;
}
