import React, { FunctionComponent } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

type CountDisplayProps = {
    count: number;
    isFetching: boolean;
};

export const CountLabel: FunctionComponent<CountDisplayProps> = ({
    count,
    isFetching,
}) => {
    const { formatMessage } = useSafeIntl();

    return (
        <Box
            display="flex"
            justifyContent="flex-end"
            alignItems="center"
            mb={1}
            height={24}
        >
            {isFetching ? (
                <CircularProgress size={16} color="inherit" />
            ) : (
                <Typography>
                    {count} {formatMessage(MESSAGES.results)}
                </Typography>
            )}
        </Box>
    );
};
