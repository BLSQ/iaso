import React, { FC } from 'react';
import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';
import { MISSION_TYPE_OPTIONS } from './missionTypeOptions';

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
    value: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        py: 1.25,
        px: 2,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'grey.100',
        color: 'text.primary',
        fontWeight: 700,
        fontSize: '0.8125rem',
    },
    icon: {
        fontSize: 20,
        color: 'text.secondary',
    },
};

type Props = {
    missionType: MissionTypeDa2Enum;
};

export const MissionTypeDisplay: FC<Props> = ({ missionType }) => {
    const { formatMessage } = useSafeIntl();
    const option = MISSION_TYPE_OPTIONS.find(o => o.value === missionType);
    if (!option) {
        return null;
    }
    const { Icon, labelMessage } = option;
    return (
        <Box sx={styles.root}>
            <Typography sx={styles.label}>
                {formatMessage(MESSAGES.missionType)}
            </Typography>
            <Box sx={styles.value}>
                <Icon sx={styles.icon} />
                {formatMessage(labelMessage)}
            </Box>
        </Box>
    );
};
