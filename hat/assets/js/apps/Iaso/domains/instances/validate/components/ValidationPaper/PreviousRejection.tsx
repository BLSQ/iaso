import React, { FunctionComponent } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';

type Props = {
    instanceId: number;
};

export const PreviousRejection: FunctionComponent<Props> = ({ instanceId }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Paper
            elevation={1}
            sx={{
                padding: theme => theme.spacing(2),
                margin: 0,
                overflow: 'auto',
                marginLeft: theme => theme.spacing(2),
                marginRight: theme => theme.spacing(2),
                marginTop: theme => theme.spacing(2),
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 'bold' }}>
                    {formatMessage(MESSAGES.form)}
                </Typography>
                <Typography>{instanceId}</Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 'bold' }}>
                    {formatMessage(MESSAGES.step)}
                </Typography>
                <Typography>{instanceId}</Typography>
            </Box>
        </Paper>
    );
};
