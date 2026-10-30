import React, { FC } from 'react';
import { Alert, Box } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

const styles = {
    alert: { mb: 2 },
    title: { fontWeight: 500, mr: 0.5 },
} satisfies SxStyles;

export const DeprecatedPlanningWarning: FC = () => {
    const { formatMessage } = useSafeIntl();
    return (
        <Alert severity="warning" variant="standard" sx={styles.alert}>
            <Box component="span" sx={styles.title}>
                {formatMessage(MESSAGES.readOnlyPlanning)}
            </Box>
            {formatMessage(MESSAGES.deprecatedPlanningInfos)}
        </Alert>
    );
};
