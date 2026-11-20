import React, { FunctionComponent } from 'react';
import Box from '@mui/material/Box/Box';
import Stack from '@mui/material/Stack/Stack';
import Typography from '@mui/material/Typography/Typography';
import { SxStyles } from 'Iaso/types/general';

const styles: SxStyles = {
    stepBadge: {
        width: 22,
        height: 22,
        borderRadius: '50%',
        backgroundColor: 'text.primary',
        color: 'common.white',
        fontSize: '12px',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
};

type Props = {
    title: string;
    description?: string;
    step?: number;
};

export const MissionStepHeader: FunctionComponent<Props> = ({
    title,
    description,
    step,
}) => (
    <Stack direction="row" spacing={1.5} alignItems="flex-start" mb={2}>
        {step !== undefined && (
            <Box sx={styles.stepBadge} aria-hidden>
                {step}
            </Box>
        )}
        <Box>
            <Typography variant="body2" fontWeight="bold">
                {title}
            </Typography>
            {description && (
                <Typography variant="caption">{description}</Typography>
            )}
        </Box>
    </Stack>
);
