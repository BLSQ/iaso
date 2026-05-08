import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { endpoint } from '../../constants';
import { PlanningParams } from '../../types';
import { useGetPlannings, useGetPlanningsOptions } from './useGetPlannings';

const { mockGetRequest } = vi.hoisted(() => ({
    mockGetRequest: vi.fn(),
}));

vi.mock('Iaso/libs/Api', () => ({
    getRequest: (...args: unknown[]) => mockGetRequest(...args),
}));

vi.mock('Iaso/utils/dates', () => ({
    dateRangePickerToDateApi: vi.fn((dateStr?: string) =>
        dateStr ? `api:${dateStr}` : undefined,
    ),
    dateApiToDateRangePicker: vi.fn((dateStr?: string) =>
        dateStr ? `picker:${dateStr}` : null,
    ),
}));

const createWrapper = () => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <IntlProvider locale="en" messages={{}}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </IntlProvider>
    );
    Wrapper.displayName = 'TestQueryClientWrapper';
    return Wrapper;
};

const minimalPlanning = {
    id: 1,
    name: 'Alpha',
    forms: [] as number[],
    pipeline_uuids: [] as string[],
    assignments_count: 0,
    started_at: '2024-01-01',
    ended_at: '2024-01-31',
};

describe('useGetPlanningsOptions', () => {
    beforeEach(() => {
        mockGetRequest.mockReset();
    });

    it('returns dropdown options mapped from the API response', async () => {
        mockGetRequest.mockResolvedValue([
            {
                ...minimalPlanning,
                id: 10,
                name: 'Plan A',
            },
        ]);

        const { result } = renderHook(
            () => useGetPlanningsOptions(undefined, true),
            { wrapper: createWrapper() },
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual([
            {
                value: 10,
                label: 'Plan A',
                original: {
                    ...minimalPlanning,
                    id: 10,
                    name: 'Plan A',
                },
            },
        ]);
        expect(mockGetRequest).toHaveBeenCalledWith(`${endpoint}?`);
    });

    it('requests form_ids when formIds is provided', async () => {
        mockGetRequest.mockResolvedValue([]);

        renderHook(() => useGetPlanningsOptions('12,34', true), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(mockGetRequest).toHaveBeenCalledWith(
                `${endpoint}?form_ids=12%2C34`,
            );
        });
    });

    it('does not call the API when enabled is false', async () => {
        renderHook(() => useGetPlanningsOptions('1', false), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(mockGetRequest).not.toHaveBeenCalled();
    });
});

describe('useGetPlannings', () => {
    beforeEach(() => {
        mockGetRequest.mockReset();
    });

    const listOptions = {
        publishingStatus: 'all',
        dateFrom: '01-01-2024',
        dateTo: '31-01-2024',
        pageSize: '20',
        page: '1',
    } as PlanningParams;

    it('requests list params and maps results in select', async () => {
        mockGetRequest.mockResolvedValue({
            count: 2,
            results: [
                {
                    ...minimalPlanning,
                    id: 1,
                    published_at: '2024-06-01',
                },
                {
                    ...minimalPlanning,
                    id: 2,
                    name: 'Draft plan',
                    published_at: undefined,
                },
            ],
        });

        const { result } = renderHook(() => useGetPlannings(listOptions), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        const calledUrl = mockGetRequest.mock.calls[0][0] as string;
        expect(calledUrl).toContain(`${endpoint}?`);
        expect(calledUrl).toContain('publishing_status=all');
        expect(calledUrl).toContain('limit=20');
        expect(calledUrl).toContain('started_at__gte=api%3A01-01-2024');
        expect(calledUrl).toContain('ended_at__lte=api%3A31-01-2024');

        expect(result.current.data?.results).toEqual([
            {
                ...minimalPlanning,
                id: 1,
                published_at: '2024-06-01',
                status: 'published',
                started_at: 'picker:2024-01-01',
                ended_at: 'picker:2024-01-31',
            },
            {
                ...minimalPlanning,
                id: 2,
                name: 'Draft plan',
                published_at: undefined,
                status: 'draft',
                started_at: 'picker:2024-01-01',
                ended_at: 'picker:2024-01-31',
            },
        ]);
    });
});
