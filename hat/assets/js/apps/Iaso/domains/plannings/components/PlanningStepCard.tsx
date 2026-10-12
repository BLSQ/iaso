import React, { FC, ReactNode } from 'react';
import { Avatar, Box, Card, Divider, Stack, Typography } from '@mui/material';
import { SxStyles } from 'Iaso/types/general';

const styles = {
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
    content: {
        p: 2,
    },
} satisfies SxStyles;

type Props = {
    step: number;
    title: string;
    description?: string;
    children: ReactNode;
};

export const PlanningStepCard: FC<Props> = ({
    step,
    title,
    description,
    children,
}) => (
    <Card variant="outlined">
        <Stack direction="row" alignItems="center" gap={1.5} sx={styles.header}>
            <Avatar sx={styles.stepNumber}>{step}</Avatar>
            <Box>
                <Typography variant="h6" component="h2">
                    {title}
                </Typography>
                {description && (
                    <Typography variant="body2" color="text.secondary">
                        {description}
                    </Typography>
                )}
            </Box>
        </Stack>
        <Divider />
        <Box sx={styles.content}>{children}</Box>
    </Card>
);
