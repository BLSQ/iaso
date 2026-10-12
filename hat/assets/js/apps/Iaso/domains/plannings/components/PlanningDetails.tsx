import React, { FC } from 'react';
import { Box, Grid } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';
import { MissionPanel } from './MissionPanel';
import { PlanningForm } from './PlanningForm';
import { PlanningHeader } from './PlanningHeader';

const styles = {
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
    },
    grid: {
        flex: { md: 1 },
        minHeight: { md: 486 },
    },
    missionPanelContainer: {
        position: 'relative',
        height: '100%',
    },
    missionPanel: {
        position: { md: 'absolute' },
        inset: 0,
    },
} satisfies SxStyles;

export const PlanningDetails: FC = () => (
    <Box sx={styles.root}>
        <PlanningHeader />
        <Grid
            container
            columnSpacing={2}
            rowSpacing={{ xs: 2, md: 0 }}
            sx={styles.grid}
        >
            <Grid item md={6} xs={12}>
                <PlanningForm />
            </Grid>
            <Grid item md={6} xs={12}>
                <Box sx={styles.missionPanelContainer}>
                    <Box sx={styles.missionPanel}>
                        <MissionPanel />
                    </Box>
                </Box>
            </Grid>
        </Grid>
    </Box>
);
