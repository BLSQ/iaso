import React from 'react';
import { Box } from '@mui/material';
import { SxStyles } from '../../../../types/general';

export const summaryStyles: SxStyles = {
    item: {
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
    },
    // fixed columns, so a missing value doesn't move the others
    fields: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 2,
    },
    emptyValue: {
        color: 'text.secondary',
    },
};

export type SummaryItemProps = {
    item: Record<string, any>;
    // shown instead of the name when there is no mapping
    emptyLabel?: string;
};

// the name, or the id when the name is not stored
export const nameOrId = (target: Record<string, any>) =>
    target.displayName ?? target.name ?? target.id;

export const emptyValue = (label?: string) =>
    label ? (
        <Box component="span" sx={summaryStyles.emptyValue}>
            {label}
        </Box>
    ) : undefined;
