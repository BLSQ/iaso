import React, { FunctionComponent } from 'react';
import Check from '@mui/icons-material/Check';
import FilterList from '@mui/icons-material/FilterList';
import ListAlt from '@mui/icons-material/ListAlt';
import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import Divider from '@mui/material/Divider/Divider';
import Paper from '@mui/material/Paper/Paper';
import { SxProps, Theme } from '@mui/material/styles';
import Typography from '@mui/material/Typography/Typography';
import { useSafeIntl } from 'bluesquare-components';
import { Link as RouterLink } from 'react-router-dom';
import { baseUrls } from 'Iaso/constants/urls';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../messages';

export type RequiredFilterStatus = 'done' | 'required' | 'waiting' | 'error';

export type RequiredFilterStep = {
    key: string;
    label: string;
    description: string;
    // Displayed in red below the description
    error?: string;
    status: RequiredFilterStatus;
};

type Props = {
    steps: RequiredFilterStep[];
    onAddFilters: () => void;
};

const STATUS_MESSAGES: Partial<
    Record<RequiredFilterStatus, (typeof MESSAGES)[keyof typeof MESSAGES]>
> = {
    required: MESSAGES.stepRequired,
    waiting: MESSAGES.stepWaiting,
};

const styles: SxStyles = {
    root: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        mt: 2,
        px: 2,
        py: 6,
    },
    content: {
        width: '100%',
        maxWidth: 560,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    icon: {
        fontSize: 40,
        color: 'primary.main',
    },
    description: {
        mt: 1,
        color: 'text.secondary',
    },
    steps: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        mt: 3,
    },
    step: {
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 2,
        py: 1.5,
        textAlign: 'left',
        border: theme => `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
    },
    stepWaiting: {
        backgroundColor: 'action.hover',
        color: 'text.disabled',
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize: 14,
        fontWeight: 'bold',
        color: 'common.white',
        backgroundColor: 'primary.main',
    },
    stepText: {
        flex: 1,
        minWidth: 0,
    },
    stepDescription: {
        color: 'text.secondary',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    stepDescriptionError: {
        color: 'error.main',
    },
    required: {
        color: 'error.main',
        ml: 0.5,
    },
    actions: {
        mt: 3,
    },
    divider: {
        width: '100%',
        mt: 3,
        mb: 2,
    },
    footer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 1,
        color: 'text.secondary',
    },
};

const getNumberColor = (status: RequiredFilterStatus): string => {
    switch (status) {
        case 'done':
            return 'success.main';
        case 'error':
            return 'error.main';
        case 'waiting':
            return 'action.disabled';
        default:
            return 'primary.main';
    }
};

// Displayed instead of the results while the required filters are not set
export const EmptyState: FunctionComponent<Props> = ({
    steps,
    onAddFilters,
}) => {
    const { formatMessage } = useSafeIntl();
    const remaining = steps.filter(step => step.status !== 'done').length;
    return (
        <Paper sx={styles.root}>
            <Box sx={styles.content}>
                <FilterList sx={styles.icon} />
                <Typography variant="h6" mt={1}>
                    {formatMessage(MESSAGES.requiredFiltersTitle, {
                        count: `${remaining}`,
                    })}
                </Typography>
                <Typography variant="body2" sx={styles.description}>
                    {formatMessage(MESSAGES.requiredFiltersInfo)}
                </Typography>
                <Box sx={styles.steps}>
                    {steps.map((step, index) => {
                        const isWaiting = step.status === 'waiting';
                        const statusMessage = STATUS_MESSAGES[step.status];
                        return (
                            <Box
                                key={step.key}
                                sx={
                                    [
                                        styles.step,
                                        isWaiting && styles.stepWaiting,
                                    ] as SxProps<Theme>
                                }
                            >
                                <Box
                                    sx={
                                        [
                                            styles.stepNumber,
                                            {
                                                backgroundColor: getNumberColor(
                                                    step.status,
                                                ),
                                            },
                                        ] as SxProps<Theme>
                                    }
                                >
                                    {step.status === 'done' ? (
                                        <Check fontSize="small" />
                                    ) : (
                                        index + 1
                                    )}
                                </Box>
                                <Box sx={styles.stepText}>
                                    <Typography
                                        variant="body2"
                                        fontWeight="medium"
                                        color={
                                            isWaiting
                                                ? 'text.disabled'
                                                : 'text.primary'
                                        }
                                    >
                                        {step.label}
                                        <Box
                                            component="span"
                                            sx={styles.required}
                                        >
                                            *
                                        </Box>
                                    </Typography>
                                    <Typography
                                        variant="body2"
                                        noWrap
                                        sx={styles.stepDescription}
                                    >
                                        {step.description}
                                    </Typography>
                                    {step.error && (
                                        <Typography
                                            variant="body2"
                                            sx={styles.stepDescriptionError}
                                        >
                                            {step.error}
                                        </Typography>
                                    )}
                                </Box>
                                {statusMessage && (
                                    <Typography
                                        variant="body2"
                                        color={
                                            isWaiting
                                                ? 'text.disabled'
                                                : 'text.secondary'
                                        }
                                    >
                                        {formatMessage(statusMessage)}
                                    </Typography>
                                )}
                            </Box>
                        );
                    })}
                </Box>
                <Box sx={styles.actions}>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<FilterList />}
                        onClick={onAddFilters}
                    >
                        {formatMessage(MESSAGES.addFilters)}
                    </Button>
                </Box>
                <Divider sx={styles.divider} />
                <Box sx={styles.footer}>
                    <Typography variant="body2">
                        {formatMessage(MESSAGES.startFromForm)}
                    </Typography>
                    <Button
                        color="primary"
                        startIcon={<ListAlt />}
                        component={RouterLink}
                        to={`/${baseUrls.forms}`}
                    >
                        {formatMessage(MESSAGES.browseForms)}
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};
