import React, { FC } from 'react';
import { Box, Grid } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';
import { MissionPanel } from './MissionPanel';
import { PlanningFormV2 } from './PlanningFormV2';
import { PlanningHeader } from './PlanningHeader';

const styles = {
    grid: {
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
    <>
        <PlanningHeader />
        <Grid
            container
            columnSpacing={2}
            rowSpacing={{ xs: 2, md: 0 }}
            sx={styles.grid}
        >
            <Grid item md={6} xs={12}>
                <PlanningFormV2 />
            </Grid>
            <Grid item md={6} xs={12}>
                <Box sx={styles.missionPanelContainer}>
                    <Box sx={styles.missionPanel}>
                        <MissionPanel />
                    </Box>
                </Box>
            </Grid>
        </Grid>
    </>
);
