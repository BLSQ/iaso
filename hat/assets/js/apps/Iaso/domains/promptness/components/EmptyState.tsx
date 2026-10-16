import React, { FunctionComponent, ReactNode } from 'react';
import { QueryStats } from '@mui/icons-material';
import { Box, Paper, Typography } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';

type Props = {
    title: string;
    description: string;
    action?: ReactNode;
};

const styles: SxStyles = {
    root: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: 1,
        mt: 1,
        px: 2,
        py: 6,
    },
    icon: {
        fontSize: 40,
        color: 'text.secondary',
    },
    description: {
        maxWidth: 420,
        color: 'text.secondary',
    },
};

// Displayed instead of the results while the required filters are not set
export const EmptyState: FunctionComponent<Props> = ({
    title,
    description,
    action,
}) => (
    <Paper variant="outlined" sx={styles.root}>
        <QueryStats sx={styles.icon} />
        <Typography variant="subtitle1" fontWeight="bold">
            {title}
        </Typography>
        <Typography variant="body2" sx={styles.description}>
            {description}
        </Typography>
        {action && <Box mt={1}>{action}</Box>}
    </Paper>
);
