import React, { FC } from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import { SxStyles } from 'Iaso/types/general';
import { getMissionTypeOption } from '../utils';

const styles: SxStyles = {
    badge: {
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
    smallBadge: {
        gap: 0.5,
        py: 0.25,
        px: 1,
        borderRadius: 4,
        borderColor: 'text.primary',
        fontWeight: 400,
    },
    smallIcon: {
        fontSize: 16,
        color: 'text.primary',
    },
};

type Props = {
    missionType: MissionTypeDa2Enum;
    size?: 'small' | 'medium';
};

export const MissionTypeBadge: FC<Props> = ({
    missionType,
    size = 'medium',
}) => {
    const { formatMessage } = useSafeIntl();
    const option = getMissionTypeOption(missionType);
    if (!option) {
        return null;
    }
    const { Icon, labelMessage } = option;
    const isSmall = size === 'small';
    return (
        <Box
            sx={[styles.badge, isSmall && styles.smallBadge] as SxProps<Theme>}
        >
            <Icon sx={isSmall ? styles.smallIcon : styles.icon} />
            {formatMessage(labelMessage)}
        </Box>
    );
};
