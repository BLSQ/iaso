import React, { FC } from 'react';
import { Alert, Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

const styles = {
    title: { fontWeight: 500, mr: 0.5 },
} satisfies SxStyles;

export const PublishedPlanningWarning: FC = () => {
    const { formatMessage } = useSafeIntl();
    return (
        <Alert severity="error" variant="outlined">
            <Box component="span" sx={styles.title}>
                {formatMessage(MESSAGES.editingPublishedPlanning)}
            </Box>
            {formatMessage(MESSAGES.editingPublishedPlanningDetails)}
        </Alert>
    );
};
