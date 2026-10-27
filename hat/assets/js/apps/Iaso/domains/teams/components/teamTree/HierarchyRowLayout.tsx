import React, { FC, ReactNode } from 'react';
import { Box, Stack } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';

const INDENT_PER_LEVEL = 3;

const styles = {
    row: {
        display: 'flex',
        alignItems: 'center',
        minHeight: 44,
        pr: 2,
        borderBottom: 1,
        borderColor: 'divider',
        transition: 'background-color 0.15s',
    },
    dropTarget: {
        bgcolor: 'action.selected',
        outline: 2,
        outlineColor: 'primary.main',
        outlineOffset: -2,
    },
    dragging: {
        opacity: 0.4,
    },
    handleSlot: {
        display: 'flex',
        width: 24,
        flexShrink: 0,
    },
    toggleSlot: {
        display: 'flex',
        justifyContent: 'center',
        width: 32,
        flexShrink: 0,
    },
    content: {
        flex: 1,
        minWidth: 0,
    },
} satisfies SxStyles;

type Props = {
    depth: number;
    rowRef?: (element: HTMLElement | null) => void;
    handle?: ReactNode;
    toggle?: ReactNode;
    isDropTarget?: boolean;
    isDragging?: boolean;
    children: ReactNode;
};

export const HierarchyRowLayout: FC<Props> = ({
    depth,
    rowRef,
    handle,
    toggle,
    isDropTarget = false,
    isDragging = false,
    children,
}) => (
    <Box
        ref={rowRef}
        sx={[
            styles.row,
            { pl: 2 + depth * INDENT_PER_LEVEL },
            isDropTarget && styles.dropTarget,
            isDragging && styles.dragging,
        ]}
    >
        <Box sx={styles.handleSlot}>{handle}</Box>
        <Box sx={styles.toggleSlot}>{toggle}</Box>
        <Stack direction="row" alignItems="center" gap={1} sx={styles.content}>
            {children}
        </Stack>
    </Box>
);
