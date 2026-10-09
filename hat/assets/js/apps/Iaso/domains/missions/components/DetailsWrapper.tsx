import React from 'react';
import { Box, Paper } from '@mui/material';
import { Typography } from '@mui/material';
import { MENU_HEIGHT_WITHOUT_TABS } from 'bluesquare-components';
import { MainWrapper } from 'Iaso/components/MainWrapper';
import { SxStyles } from 'Iaso/types/general';

const HEADER_HEIGHT = '80px';
const styles: SxStyles = {
    root: {
        backgroundColor: theme => theme.palette.background.blueGrey,
        padding: 0,
    },
    paper: {
        maxWidth: theme => theme.breakpoints.values.md,
        margin: '0 auto',
    },
    headerContainer: {
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
        height: HEADER_HEIGHT,
        position: 'relative',
    },
    header: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        maxWidth: theme => theme.breakpoints.values.md,
        margin: '0 auto',
        alignItems: 'center',
        height: '100%',
        boxSizing: 'border-box',
        px: { xs: 2, md: 0 },
    },
    paperContainer: {
        height: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px - ${HEADER_HEIGHT})`,
        overflow: 'auto',
        paddingTop: theme => theme.spacing(4),
        paddingBottom: theme => theme.spacing(4),
    },
};
type Props = {
    children: React.ReactNode;
    title: string;
    actions?: React.ReactNode;
};

export const DetailsWrapper: React.FC<Props> = ({
    children,
    title,
    actions,
}) => {
    return (
        <MainWrapper sx={styles.root}>
            <Box sx={styles.headerContainer}>
                <Box sx={styles.header}>
                    <Typography variant="h6">{title}</Typography>
                    <Box>{actions}</Box>
                </Box>
            </Box>
            <Box sx={styles.paperContainer}>
                <Paper sx={styles.paper}>{children}</Paper>
            </Box>
        </MainWrapper>
    );
};
