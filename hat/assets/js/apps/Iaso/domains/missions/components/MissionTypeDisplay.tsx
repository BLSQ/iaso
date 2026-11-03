import React, { FC } from 'react';
import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import { MissionTypeBadge } from './MissionTypeBadge';

const styles: SxStyles = {
    root: {
        my: 1,
    },
    label: {
        display: 'block',
        mb: 1.5,
        fontWeight: 600,
        color: 'text.primary',
        fontSize: '0.875rem',
    },
};

type Props = {
    missionType: MissionTypeDa2Enum;
};

export const MissionTypeDisplay: FC<Props> = ({ missionType }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box sx={styles.root}>
            <Typography sx={styles.label}>
                {formatMessage(MESSAGES.missionType)}
            </Typography>
            <MissionTypeBadge missionType={missionType} />
        </Box>
    );
};
