import React, { FC, ReactNode } from 'react';
import { Avatar, Box, Card, Divider, Stack, Typography } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';

const styles = {
    card: {
        position: 'relative',
    },
    header: {
        p: 2,
    },
    stepNumber: {
        width: 24,
        height: 24,
        fontSize: '0.8rem',
        fontWeight: 'bold',
        bgcolor: 'primary.main',
    },
    titleBlock: {
        flex: 1,
    },
    content: {
        p: 2,
    },
} satisfies SxStyles;

type Props = {
    step: number;
    title: string;
    description?: ReactNode;
    actions?: ReactNode;
    disableContentPadding?: boolean;
    children: ReactNode;
};

export const PlanningStepCard: FC<Props> = ({
    step,
    title,
    description,
    actions,
    disableContentPadding = false,
    children,
}) => (
    <Card variant="outlined" sx={styles.card}>
        <Stack direction="row" alignItems="center" gap={1.5} sx={styles.header}>
            <Avatar sx={styles.stepNumber}>{step}</Avatar>
            <Box sx={styles.titleBlock}>
                <Typography variant="h6" component="h2">
                    {title}
                </Typography>
                {description && (
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>
                )}
            </Box>
            {actions}
        </Stack>
        <Divider />
        <Box sx={disableContentPadding ? undefined : styles.content}>
            {children}
        </Box>
    </Card>
);
