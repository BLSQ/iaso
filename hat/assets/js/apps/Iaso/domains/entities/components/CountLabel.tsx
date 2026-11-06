import React, { FunctionComponent } from 'react';
import Box from '@mui/material/Box/Box';
import CircularProgress from '@mui/material/CircularProgress/CircularProgress';
import Typography from '@mui/material/Typography/Typography';
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
