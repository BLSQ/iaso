import React, { FC } from 'react';
import { Box, Divider, Paper, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';
import { StepDraft } from '../../hooks/useStepsEditor';
import MESSAGES from '../../messages';

const styles = {
    header: {
        px: 2,
        py: 1.5,
    },
    list: {
        px: 2,
        py: 2,
    },
    item: {
        display: 'flex',
        gap: 1.5,
    },
    rail: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    order: {
        flexShrink: 0,
        width: 22,
        height: 22,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '0.75rem',
        color: 'text.secondary',
        backgroundColor: 'grey.100',
        border: theme => `1px solid ${theme.palette.divider}`,
    },
    connector: {
        flex: 1,
        width: '1px',
        minHeight: 12,
        my: 0.5,
        backgroundColor: 'divider',
    },
    content: {
        pb: 2,
        minWidth: 0,
    },
    name: {
        lineHeight: '22px',
        overflowWrap: 'anywhere',
    },
} satisfies SxStyles;

type Props = {
    steps: StepDraft[];
    getRoleNames: (roleIds: number[]) => string;
};

export const StepsPreview: FC<Props> = ({ steps, getRoleNames }) => {
    const { formatMessage } = useSafeIntl();
    // Validators see the chain top-down, from the last step to the first.
    const chain = steps
        .map((step, index) => ({ step, order: index + 1 }))
        .reverse();
    return (
        <Paper elevation={1}>
            <Box sx={styles.header}>
                <Typography variant="h6">
                    {formatMessage(MESSAGES.preview)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {formatMessage(MESSAGES.previewSubtitle)}
                </Typography>
            </Box>
            <Divider />
            <Box sx={styles.list}>
                {chain.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        {formatMessage(MESSAGES.noSteps)}
                    </Typography>
                )}
                {chain.map(({ step, order }, index) => {
                    const isLast = index === chain.length - 1;
                    const roles = getRoleNames(step.roleIds);
                    return (
                        <Box key={step.slug} sx={styles.item}>
                            <Box sx={styles.rail}>
                                <Box sx={styles.order}>{order}</Box>
                                {!isLast && <Box sx={styles.connector} />}
                            </Box>
                            <Box
                                sx={{
                                    ...styles.content,
                                    ...(isLast ? { pb: 0 } : {}),
                                }}
                            >
                                <Typography variant="body2" sx={styles.name}>
                                    {step.name || '—'}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                >
                                    {roles || formatMessage(MESSAGES.noRole)}
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
};
