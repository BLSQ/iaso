import React, { ReactNode, forwardRef } from 'react';
import { Box, Stack, SxProps, Theme, Typography } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';

export const INDENT_PX = 18;
const GUIDE_LEFT_PX = 21;

const styles = {
    row: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        borderLeft: '3px solid transparent',
        py: 0.5,
    },
    clickable: {
        cursor: 'pointer',
        '&:hover': { bgcolor: 'action.hover' },
    },
    indentGuides: {
        position: 'absolute',
        left: GUIDE_LEFT_PX,
        top: 0,
        bottom: 0,
        backgroundImage:
            'linear-gradient(to right, rgba(0,0,0,0.14) 1px, transparent 1px)',
        backgroundSize: `${INDENT_PX}px 100%`,
        pointerEvents: 'none',
    },
    texts: {
        flex: 1,
        minWidth: 0,
    },
    nameLine: {
        gap: 0.625,
        minWidth: 0,
    },
} satisfies SxStyles;

type Props = {
    paddingLeft: number;
    guideLevels: number;
    onClick?: () => void;
    leading?: ReactNode;
    nameIcon?: ReactNode;
    name: string;
    nameSx?: SxProps<Theme>;
    caption?: string;
    trailing?: ReactNode;
    sx?: SxProps<Theme>;
    children?: ReactNode;
};

export const TeamsPanelRowLayout = forwardRef<HTMLDivElement, Props>(
    (
        {
            paddingLeft,
            guideLevels,
            onClick,
            leading,
            nameIcon,
            name,
            nameSx,
            caption,
            trailing,
            sx,
            children,
            ...tooltipProps
        },
        ref,
    ) => (
        <Box
            {...tooltipProps}
            ref={ref}
            onClick={onClick}
            style={{ paddingLeft }}
            sx={[
                styles.row,
                Boolean(onClick) && styles.clickable,
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
        >
            <Box
                sx={styles.indentGuides}
                style={{ width: guideLevels * INDENT_PX }}
            />
            {children}
            {leading}
            <Box sx={styles.texts}>
                <Stack direction="row" alignItems="center" sx={styles.nameLine}>
                    {nameIcon}
                    <Typography variant="body2" noWrap sx={nameSx}>
                        {name}
                    </Typography>
                </Stack>
                {caption && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                        component="div"
                    >
                        {caption}
                    </Typography>
                )}
            </Box>
            {trailing}
        </Box>
    ),
);

TeamsPanelRowLayout.displayName = 'TeamsPanelRowLayout';
