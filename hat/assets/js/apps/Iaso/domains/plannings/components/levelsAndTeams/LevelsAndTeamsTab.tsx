import React, { FC } from 'react';
import { Stack } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';
import { TeamHierarchySection } from '../teamHierarchy/TeamHierarchySection';
import { OrgUnitLevelsSection } from '../orgUnitLevels/OrgUnitLevelsSection';
import { TargetGeographySection } from './TargetGeographySection';

const styles = {
    wrapper: { pb: 3 },
} satisfies SxStyles;

export const LevelsAndTeamsTab: FC = () => (
    <Stack gap={2} sx={styles.wrapper}>
        <TargetGeographySection />
        <TeamHierarchySection />
        <OrgUnitLevelsSection />
    </Stack>
);
