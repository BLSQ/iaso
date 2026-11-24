import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import {
    QueryClient,
    QueryClientProvider,
    QueryFunction,
    QueryKey,
    UseQueryOptions,
} from 'react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useGetInstance, useGetInstances } from './useGetInstance';

const { mockGetRequest } = vi.hoisted(() => ({
    mockGetRequest: vi.fn(),
}));

vi.mock('../../../../libs/Api', () => ({
    getRequest: (...args: unknown[]) => mockGetRequest(...args),
}));

vi.mock('../../../../libs/apiHooks', async () => {
    const { useQuery } = await import('react-query');
    return {
        // the snackbar isn't under test here
        useSnackQuery: ({
            queryKey,
            queryFn,
            options,
        }: {
            queryKey: QueryKey;
            queryFn: QueryFunction;
            options: UseQueryOptions;
        }) => useQuery(queryKey, queryFn, options),
    };
});

const wrapper = (queryClient: QueryClient) => {
    const QueryWrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
    return QueryWrapper;
};

describe('useGetInstances', () => {
    beforeEach(() => {
        mockGetRequest.mockReset();
        mockGetRequest.mockImplementation((url: string) =>
            Promise.resolve({ id: url, hidden_fields: [] }),
        );
    });

    it('loads every submission', async () => {
        const { result } = renderHook(() => useGetInstances(['1', '2']), {
            wrapper: wrapper(new QueryClient()),
        });

        await waitFor(() =>
            expect(result.current.every(query => query.isSuccess)).toBe(true),
        );
        expect(result.current.map(query => query.data?.id)).toEqual([
            '/api/instances/1/',
            '/api/instances/2/',
        ]);
    });

    it('shares the cache of useGetInstance', async () => {
        const queryClient = new QueryClient();
        const { result } = renderHook(
            () => ({
                single: useGetInstance('1'),
                many: useGetInstances(['1']),
            }),
            { wrapper: wrapper(queryClient) },
        );

        await waitFor(() =>
            expect(result.current.many[0].isSuccess).toBe(true),
        );
        expect(result.current.single.data).toEqual(result.current.many[0].data);
        expect(mockGetRequest).toHaveBeenCalledTimes(1);
    });
});
