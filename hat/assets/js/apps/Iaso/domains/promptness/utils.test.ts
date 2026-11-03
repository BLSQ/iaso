import { createElement, ReactNode } from 'react';
import { Theme, ThemeProvider } from '@mui/material';
import { renderHook } from '@testing-library/react';
import { textPlaceholder } from 'bluesquare-components';
import { describe, expect, it } from 'vitest';
import {
    PROMPTNESS_STATUSES,
    STATUS_LATE,
    STATUS_MISSING,
    STATUS_ON_TIME,
} from './constants';
import { PromptnessStatus } from './types';
import {
    formatPercent,
    getDefaultOrder,
    getSelectedStatuses,
    getStatusColor,
    useGetStatusColor,
} from './utils';

// Distinct sentinel values, so a status mapped to the wrong
// palette entry (e.g. error instead of warning) fails the test
const theme = {
    palette: {
        success: { main: 'success-main' },
        warning: { main: 'warning-main' },
        error: { main: 'error-main' },
        grey: { 600: 'grey-600' },
    },
} as unknown as Theme;

describe('getSelectedStatuses', () => {
    it('returns all the statuses when there is no status filter', () => {
        expect(getSelectedStatuses()).toEqual(PROMPTNESS_STATUSES);
        expect(getSelectedStatuses('')).toEqual(PROMPTNESS_STATUSES);
    });

    it('returns the statuses of the filter', () => {
        expect(getSelectedStatuses('LATE')).toEqual(['LATE']);
        expect(getSelectedStatuses('ON_TIME,MISSING')).toEqual([
            'ON_TIME',
            'MISSING',
        ]);
    });
});

describe('getDefaultOrder', () => {
    it('orders by most missing when all the statuses are selected', () => {
        expect(getDefaultOrder()).toBe('-missing');
        expect(getDefaultOrder('ON_TIME,LATE,MISSING')).toBe('-missing');
    });

    it('orders by most missing when missing is selected', () => {
        expect(getDefaultOrder('ON_TIME,MISSING')).toBe('-missing');
        expect(getDefaultOrder('MISSING')).toBe('-missing');
    });

    it('orders by most late when missing is not selected', () => {
        expect(getDefaultOrder('ON_TIME,LATE')).toBe('-late');
        expect(getDefaultOrder('LATE')).toBe('-late');
    });

    it('orders by fewest on time when only on time is selected', () => {
        expect(getDefaultOrder('ON_TIME')).toBe('on_time');
    });

    it('does not depend on the order of the statuses in the filter', () => {
        expect(getDefaultOrder('LATE,ON_TIME')).toBe('-late');
        expect(getDefaultOrder('MISSING,ON_TIME')).toBe('-missing');
    });

    it('falls back to most missing for unknown statuses', () => {
        expect(getDefaultOrder('UNKNOWN')).toBe('-missing');
    });
});

describe('formatPercent', () => {
    it('returns the placeholder when there is no value', () => {
        expect(formatPercent()).toBe(textPlaceholder);
        expect(formatPercent(undefined)).toBe(textPlaceholder);
        expect(formatPercent(null)).toBe(textPlaceholder);
    });

    it('formats 0 as a percentage, not as a missing value', () => {
        expect(formatPercent(0)).toBe('0%');
    });

    it('rounds the percentage', () => {
        expect(formatPercent(42)).toBe('42%');
        expect(formatPercent(42.4)).toBe('42%');
        expect(formatPercent(42.5)).toBe('43%');
        expect(formatPercent(99.9)).toBe('100%');
        expect(formatPercent(100)).toBe('100%');
    });
});

describe('getStatusColor', () => {
    it('returns the success color for on time submissions', () => {
        expect(getStatusColor(theme, STATUS_ON_TIME)).toBe('success-main');
    });

    it('returns the warning color for late submissions', () => {
        expect(getStatusColor(theme, STATUS_LATE)).toBe('warning-main');
    });

    it('returns the error color for missing submissions', () => {
        expect(getStatusColor(theme, STATUS_MISSING)).toBe('error-main');
    });

    it('falls back to grey for unknown statuses', () => {
        const unknownStatus = 'UNKNOWN' as unknown as PromptnessStatus;
        expect(getStatusColor(theme, unknownStatus)).toBe('grey-600');
    });
});

describe('useGetStatusColor', () => {
    const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(ThemeProvider, { theme }, children);

    it('returns a function mapping statuses to the theme colors', () => {
        const { result } = renderHook(() => useGetStatusColor(), {
            wrapper,
        });
        expect(result.current(STATUS_ON_TIME)).toBe('success-main');
        expect(result.current(STATUS_LATE)).toBe('warning-main');
        expect(result.current(STATUS_MISSING)).toBe('error-main');
    });

    it('falls back to grey for unknown statuses', () => {
        const { result } = renderHook(() => useGetStatusColor(), {
            wrapper,
        });
        const unknownStatus = 'UNKNOWN' as unknown as PromptnessStatus;
        expect(result.current(unknownStatus)).toBe('grey-600');
    });
});
