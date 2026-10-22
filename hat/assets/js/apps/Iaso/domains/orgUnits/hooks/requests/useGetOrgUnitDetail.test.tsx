import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    ORG_UNIT_LINK_FIELDS,
    useGetOrgUnitDetail,
} from './useGetOrgUnitDetail';

const { mockGetRequest } = vi.hoisted(() => ({
    mockGetRequest: vi.fn(),
}));

vi.mock('../../../../libs/Api', () => ({
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

const orgUnitResponse = { id: 1, name: 'Belgium' };

describe('useGetOrgUnitDetail', () => {
    beforeEach(() => {
        mockGetRequest.mockReset();
        mockGetRequest.mockResolvedValue(orgUnitResponse);
    });

    it('fetches the full org unit when no fields are requested', async () => {
        const { result } = renderHook(() => useGetOrgUnitDetail(1), {
            wrapper: createWrapper(),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockGetRequest).toHaveBeenCalledWith('/api/orgunits/1/');
        expect(result.current.data).toEqual(orgUnitResponse);
    });

    it('requests only the link fields, skipping instances_count', async () => {
        const { result } = renderHook(
            () => useGetOrgUnitDetail(1, ORG_UNIT_LINK_FIELDS),
            { wrapper: createWrapper() },
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockGetRequest).toHaveBeenCalledWith(
            '/api/orgunits/1/?fields=id,name',
        );
    });

    it('does not share the cache between full and fields-scoped requests', async () => {
        const wrapper = createWrapper();
        const { result: full } = renderHook(() => useGetOrgUnitDetail(1), {
            wrapper,
        });
        await waitFor(() => expect(full.current.isSuccess).toBe(true));

        const { result: link } = renderHook(
            () => useGetOrgUnitDetail(1, ORG_UNIT_LINK_FIELDS),
            { wrapper },
        );
        // a shared cache entry would hand over the full org unit right away
        expect(link.current.data).toBeUndefined();
        await waitFor(() => expect(link.current.isSuccess).toBe(true));

        expect(mockGetRequest).toHaveBeenCalledTimes(2);
    });

    it('does not fetch without an id', () => {
        renderHook(() => useGetOrgUnitDetail(undefined, ORG_UNIT_LINK_FIELDS), {
            wrapper: createWrapper(),
        });

        expect(mockGetRequest).not.toHaveBeenCalled();
    });
});
