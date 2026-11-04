import React, { FC } from 'react';
import { Box, Chip, SxProps, Theme, alpha } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

type Status = 'draft' | 'published' | 'deprecated';

type Props = {
    status: Status;
    sx?: SxProps<Theme>;
};

const getStatusColor = (theme: Theme, status: Status): string => {
    switch (status) {
        case 'published':
            return theme.palette.success.main;
        case 'deprecated':
            return theme.palette.warning.main;
        default:
            return theme.palette.grey[600];
    }
};

const getStatusTextColor = (theme: Theme, status: Status): string => {
    switch (status) {
        case 'published':
            return theme.palette.success.dark;
        case 'deprecated':
            return theme.palette.warning.dark;
        default:
            return theme.palette.grey[700];
    }
};

const STATUS_MESSAGES = {
    draft: MESSAGES.draft,
    published: MESSAGES.published,
    deprecated: MESSAGES.deprecated,
};

const styles = {
    chip: {
        height: 22,
        borderRadius: '11px',
        fontSize: '0.7rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
        '& .MuiChip-icon': {
            marginLeft: '8px',
            marginRight: '-2px',
        },
        '& .MuiChip-label': {
            paddingLeft: '6px',
            paddingRight: '10px',
        },
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: '50%',
        backgroundColor: 'currentColor',
    },
} satisfies SxStyles;

export const PlanningStatusChip: FC<Props> = ({ status, sx }) => {
    const { formatMessage } = useSafeIntl();
    return (
        <Chip
            icon={<Box sx={styles.dot} />}
            label={formatMessage(STATUS_MESSAGES[status])}
            size="small"
            sx={[
                styles.chip,
                theme => ({
                    color: getStatusTextColor(theme, status),
                    backgroundColor: alpha(getStatusColor(theme, status), 0.15),
                    '& .MuiChip-icon': {
                        color: getStatusColor(theme, status),
                    },
                }),
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        />
    );
};
