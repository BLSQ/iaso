import React, { FunctionComponent } from 'react';
import { Paper, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

const styles: SxStyles = {
    card: {
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        borderStyle: 'dashed',
    },
    title: { fontSize: 17, fontWeight: 500, color: 'text.secondary' },
    secondary: { color: 'text.secondary' },
};

/** Where the step's checks come, before its form is sent: says how to get them. */
export const ChecksPlaceholder: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();
    return (
        <Paper variant="outlined" sx={styles.card}>
            <Typography component="h2" sx={styles.title}>
                {formatMessage(MESSAGES.whatShouldBeChecked)}
            </Typography>
            <Typography variant="body2" sx={styles.secondary}>
                {formatMessage(MESSAGES.sendToChooseChecks)}
            </Typography>
        </Paper>
    );
};
