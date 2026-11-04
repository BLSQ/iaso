import { useCallback } from 'react';
import { Theme, useTheme } from '@mui/material';
import { textPlaceholder } from 'bluesquare-components';
import {
    DEFAULT_ORDERS,
    PROMPTNESS_STATUSES,
    STATUS_LATE,
    STATUS_MISSING,
    STATUS_ON_TIME,
} from './constants';
import { PromptnessStatus } from './types';

export const getSelectedStatuses = (status?: string): string[] =>
    status ? status.split(',') : PROMPTNESS_STATUSES;

export const getDefaultOrder = (status?: string): string => {
    const selectedStatuses = getSelectedStatuses(status);
    const firstStatus =
        [...PROMPTNESS_STATUSES]
            .reverse()
            .find(promptnessStatus =>
                selectedStatuses.includes(promptnessStatus),
            ) ?? PROMPTNESS_STATUSES[PROMPTNESS_STATUSES.length - 1];
    return DEFAULT_ORDERS[firstStatus];
};

// Percentages from the API have 1 decimal, the page displays them rounded
export const formatPercent = (value?: number | null): string =>
    value === null || value === undefined
        ? textPlaceholder
        : `${Math.round(value)}%`;

export const getStatusColor = (
    theme: Theme,
    status: PromptnessStatus,
): string => {
    switch (status) {
        case STATUS_ON_TIME:
            return theme.palette.success.main;
        case STATUS_LATE:
            return theme.palette.warning.main;
        case STATUS_MISSING:
            return theme.palette.error.main;
        default:
            return theme.palette.grey[600];
    }
};

export const useGetStatusColor = () => {
    const theme = useTheme();
    return useCallback(
        (status: PromptnessStatus): string => getStatusColor(theme, status),
        [theme],
    );
};
