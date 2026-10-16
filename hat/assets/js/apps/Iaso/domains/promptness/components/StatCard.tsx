import React, { FunctionComponent, ReactNode } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';

type Props = {
    title: string;
    value: string;
    details?: string;
    icon?: ReactNode;
    color?: string;
};

const styles: SxStyles = {
    root: {
        p: 2,
        height: '100%',
    },
    title: {
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        textTransform: 'uppercase',
        fontSize: 11,
        letterSpacing: 0.5,
        color: 'text.secondary',
        '& svg': {
            fontSize: 16,
        },
    },
    value: {
        fontSize: 30,
        fontWeight: 'medium',
        lineHeight: 1.3,
        mt: 0.5,
    },
    details: {
        color: 'text.secondary',
    },
};

export const StatCard: FunctionComponent<Props> = ({
    title,
    value,
    details,
    icon,
    color = 'text.primary',
}) => (
    <Paper variant="outlined" sx={styles.root}>
        <Box sx={styles.title}>
            {icon && (
                <Box component="span" display="flex" color={color}>
                    {icon}
                </Box>
            )}
            {title}
        </Box>
        <Typography sx={{ ...styles.value, color }}>{value}</Typography>
        {details && (
            <Typography variant="body2" sx={styles.details}>
                {details}
            </Typography>
        )}
    </Paper>
);
