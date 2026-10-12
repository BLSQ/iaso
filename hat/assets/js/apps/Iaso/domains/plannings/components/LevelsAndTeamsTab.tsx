import React, { FC } from 'react';
import { Stack } from '@mui/material';
import { TargetGeographySection } from './TargetGeographySection';

export const LevelsAndTeamsTab: FC = () => (
    <Stack gap={2}>
        <TargetGeographySection />
    </Stack>
);
