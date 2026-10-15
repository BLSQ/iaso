import React, { FC } from 'react';
import { Box, Chip, SxProps, Theme, alpha } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';

type Status = 'draft' | 'published';

type Props = {
    status: Status;
    sx?: SxProps<Theme>;
};

const getStatusColor = (theme: Theme, status: Status): string =>
    status === 'published'
        ? theme.palette.success.main
        : theme.palette.grey[600];

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
            label={
                status === 'published'
                    ? formatMessage(MESSAGES.published)
                    : formatMessage(MESSAGES.draft)
            }
            size="small"
            sx={[
                styles.chip,
                theme => ({
                    color:
                        status === 'published'
                            ? theme.palette.success.dark
                            : theme.palette.grey[700],
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
