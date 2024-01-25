import React, { FunctionComponent } from 'react';
import { Box, LinearProgress, Typography } from '@mui/material';

type Props = {
    value: number;
    color?: string;
    extraLabel?: string;
}

const styles = {
    root: {
        display: "flex",
        alignItems: "center",
        flexDirection: "column",
    },
    valueContainer: {
        minWidth: 35,
    },
    progressBarContainer: {
        width: "100%",
        marginRight: 1,
    },
    typography: (color?: string) => ({
        color:  color || 'primary.main',
    }),
    progressBar: (color?: string) => ({
        backgroundColor: theme => theme.palette.ligthGray.background ,
        height: '8px',
        boxShadow: theme => `0px 0px 0px 1px ${theme.palette.ligthGray.border} inset`,
        '& .MuiLinearProgress-bar': {
            backgroundColor: color || 'primary.main',
        },
    }),
};

export const LinearProgressWithLabel: FunctionComponent<Props> = ({ value, color, extraLabel }) => (
    <Box sx={styles.root}>
        <Box sx={styles.valueContainer}>
            <Typography variant="body2" sx={styles.typography(color)}>
                {`${Math.round(value)}%`}
            </Typography>
        </Box>
        <Box sx={styles.progressBarContainer}>
            <LinearProgress
                variant="determinate"
                value={value}
                sx={styles.progressBar(color)}
            />
        </Box>
        {extraLabel && (
            <Box sx={styles.valueContainer}>
                <Typography variant="body2" sx={styles.typography(color)}>
                    {extraLabel}
                </Typography>
            </Box>
        )}
    </Box>
);
