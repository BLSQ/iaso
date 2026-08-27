import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ASSIGNMENTS_API_URL } from '../../constants/api';
import { useGetAssignments } from './useGetAssignments';

const { mockGetRequest } = vi.hoisted(() => ({
    mockGetRequest: vi.fn(),
}));

vi.mock('Iaso/libs/Api', () => ({
    getRequest: (...args: unknown[]) => mockGetRequest(...args),
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

const assignmentsResponse = [
    {
        id: 1,
        planning: 42,
        org_unit: 10,
        user: 5,
        team: 0,
        org_unit_details: {
            id: 10,
            name: 'OU 1',
            geo_json: null,
            latitude: null,
            longitude: null,
        },
    },
    {
        id: 2,
        planning: 42,
        org_unit: 11,
        user: 0,
        team: 7,
        org_unit_details: {
            id: 11,
            name: 'OU 2',
            geo_json: null,
            latitude: null,
            longitude: null,
        },
    },
];

describe('useGetAssignments', () => {
    beforeEach(() => {
        mockGetRequest.mockReset();
    });

    it('fetches assignments for a planning and returns all assignments', async () => {
        mockGetRequest.mockResolvedValue(assignmentsResponse);

        const { result } = renderHook(
            () => useGetAssignments({ planning: '42' }),
            { wrapper: createWrapper() },
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(mockGetRequest).toHaveBeenCalledWith(
            `${ASSIGNMENTS_API_URL}?planning=42`,
        );
        expect(result.current.data?.allAssignments).toEqual(
            assignmentsResponse,
        );
    });

    it('filters assignments by team when a TEAM_OF_TEAMS team is provided', async () => {
        mockGetRequest.mockResolvedValue(assignmentsResponse);

        const { result } = renderHook(
            () =>
                useGetAssignments({ planning: '42' }, {
                    id: 1,
                    type: 'TEAM_OF_TEAMS',
                    sub_teams: [7],
                } as any),
            { wrapper: createWrapper() },
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data?.assignments).toEqual([
            assignmentsResponse[1],
        ]);
    });

    it('does not fetch when planning id is missing', async () => {
        const { result } = renderHook(
            () => useGetAssignments({ planning: undefined }),
            { wrapper: createWrapper() },
        );

        await act(async () => {
            await Promise.resolve();
        });

        expect(mockGetRequest).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isFetching).toBe(false);
    });
});
