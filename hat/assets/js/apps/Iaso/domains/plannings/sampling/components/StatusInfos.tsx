import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { StatusStyles } from '../constants';
import { TaskStatus } from '../types';

type StatusInfosProps = {
    status: TaskStatus;
    message?: string;
};

export const StatusInfos: FunctionComponent<StatusInfosProps> = ({
    status,
    message,
}) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box
            sx={{
                p: 2,
                borderRadius: 1,
                ...StatusStyles[status],
            }}
        >
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {formatMessage(MESSAGES.status)}:{' '}
                {MESSAGES[status] ? formatMessage(MESSAGES[status]) : status}
            </Typography>
            {message && <Typography variant="body2">{message}</Typography>}
        </Box>
    );
};
