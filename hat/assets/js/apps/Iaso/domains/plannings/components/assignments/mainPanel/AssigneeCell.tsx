import React, { FC } from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { textPlaceholder } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { getUnassignedColor } from './AssignableOrgUnitsLayer';
import { Assignee } from './types';

const styles = {
    swatch: {
        width: 12,
        height: 12,
        borderRadius: '3px',
        border: '1px solid rgba(0,0,0,0.15)',
        flexShrink: 0,
    },
    name: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
} satisfies SxStyles;

type Props = {
    assignee?: Assignee;
};

export const AssigneeCell: FC<Props> = ({ assignee }) => {
    const theme = useTheme();
    return (
        <Stack direction="row" alignItems="center" gap={1} minWidth={0}>
            <Box
                sx={{
                    ...styles.swatch,
                    bgcolor: assignee?.color ?? getUnassignedColor(theme),
                }}
            />
            <Typography
                variant="body2"
                color={assignee ? 'text.primary' : 'text.disabled'}
                sx={styles.name}
            >
                {assignee?.name ?? textPlaceholder}
            </Typography>
        </Stack>
    );
};
