import React, { FunctionComponent } from 'react';
import { Box, Typography } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';

const styles: SxStyles = {
    root: {
        backgroundColor: 'grey.100',
        border: 1,
        borderColor: 'divider',
        borderRadius: 1,
        px: 1.4,
        py: 0.9,
        display: 'flex',
        flexDirection: 'column',
        gap: '1px',
        minWidth: 0,
    },
    label: {
        fontSize: 10.5,
        fontWeight: 500,
        color: 'text.disabled',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
    },
    value: {
        fontFamily: 'monospace',
        fontSize: 13,
        fontWeight: 500,
        color: 'text.primary',
        wordBreak: 'break-all',
    },
};
export const GpsStat: FunctionComponent<{ label: string; value: string }> = ({
    label,
    value,
}) => (
    <Box sx={styles.root}>
        <Typography component="span" sx={styles.label}>
            {label}
        </Typography>
        <Typography component="span" sx={styles.value}>
            {value}
        </Typography>
    </Box>
);
