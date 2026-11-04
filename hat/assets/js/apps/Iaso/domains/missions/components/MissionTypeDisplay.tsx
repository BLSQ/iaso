import React, { FC } from 'react';
import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import MESSAGES from '../messages';
import { MissionTypeBadge } from './MissionTypeBadge';
import { missionStyles } from './styles';

type Props = {
    missionType: MissionTypeDa2Enum;
};

export const MissionTypeDisplay: FC<Props> = ({ missionType }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Box sx={missionStyles.fieldRoot}>
            <Typography sx={missionStyles.fieldLabel}>
                {formatMessage(MESSAGES.missionType)}
            </Typography>
            <MissionTypeBadge missionType={missionType} />
        </Box>
    );
};
