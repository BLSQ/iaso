import React, { FunctionComponent, ReactNode } from 'react';
import Box from '@mui/material/Box/Box';
import Divider from '@mui/material/Divider/Divider';
import Paper from '@mui/material/Paper/Paper';
import Typography from '@mui/material/Typography/Typography';
import { SxStyles } from '../../../../types/general';

const styles: SxStyles = {
    root: {
        mb: 2,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 2,
        py: 1.5,
    },
    title: {
        minWidth: 0,
    },
    body: {
        p: 2,
    },
};

type Props = {
    title: ReactNode;
    // shown before the title, e.g. a back button
    startAdornment?: ReactNode;
    children: ReactNode;
};

export const MappingCard: FunctionComponent<Props> = ({
    title,
    startAdornment,
    children,
}) => (
    <Paper sx={styles.root}>
        <Box sx={styles.header}>
            {startAdornment}
            <Typography
                variant="h6"
                color="primary"
                noWrap
                sx={styles.title}
                title={typeof title === 'string' ? title : undefined}
            >
                {title}
            </Typography>
        </Box>
        <Divider />
        <Box sx={styles.body}>{children}</Box>
    </Paper>
);
