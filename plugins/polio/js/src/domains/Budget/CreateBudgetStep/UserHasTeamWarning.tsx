import React, { FunctionComponent } from 'react';
import { Box, Divider, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../constants/messages';

export const UserHasTeamWarning: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    return (
        <>
            <Divider />
            <Box mb={2} mt={2}>
                <Typography style={{ fontWeight: 'bold' }}>
                    {formatMessage(MESSAGES.userNeedsTeam)}
                </Typography>
            </Box>
        </>
    );
};
