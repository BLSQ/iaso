import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TREEVIEW_ORG_UNIT_FIELDS, useGetOrgUnit } from './requests';

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

const orgUnitResponse = { id: 1, name: 'OU 1' };

describe('useGetOrgUnit', () => {
    beforeEach(() => {
        mockGetRequest.mockReset();
    });

    it('requests only the treeview fields by default, skipping instances_count', async () => {
        mockGetRequest.mockResolvedValue(orgUnitResponse);

        const { result } = renderHook(() => useGetOrgUnit('1'), {
            wrapper: createWrapper(),
        });

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(mockGetRequest).toHaveBeenCalledWith(
            `/api/orgunits/1/?fields=${TREEVIEW_ORG_UNIT_FIELDS}`,
        );
        expect(TREEVIEW_ORG_UNIT_FIELDS.split(',')).not.toContain(
            'instances_count',
        );
        expect(result.current.data).toEqual(orgUnitResponse);
    });

    it('appends a fields query param when fields are requested', async () => {
        mockGetRequest.mockResolvedValue(orgUnitResponse);

        const { result } = renderHook(
            () => useGetOrgUnit('1', 'id,name,parent'),
            { wrapper: createWrapper() },
        );

        await waitFor(() => {
            expect(result.current.isSuccess).toBe(true);
        });

        expect(mockGetRequest).toHaveBeenCalledWith(
            '/api/orgunits/1/?fields=id,name,parent',
        );
    });

    it('does not fetch when orgUnitId is missing', async () => {
        const { result } = renderHook(() => useGetOrgUnit(undefined), {
            wrapper: createWrapper(),
        });

        await act(async () => {
            await Promise.resolve();
        });

        expect(mockGetRequest).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isFetching).toBe(false);
    });

    it('uses a distinct query cache entry per fields value', async () => {
        mockGetRequest.mockResolvedValue(orgUnitResponse);
        const wrapper = createWrapper();

        const { result: withoutFields } = renderHook(() => useGetOrgUnit('1'), {
            wrapper,
        });
        await waitFor(() => expect(withoutFields.current.isSuccess).toBe(true));

        const { result: withFields } = renderHook(
            () => useGetOrgUnit('1', 'id,name'),
            { wrapper },
        );
        await waitFor(() => expect(withFields.current.isSuccess).toBe(true));

        // The default fields and the custom `fields=` variant should have hit
        // the API separately rather than sharing a cache entry keyed only on
        // the org unit id.
        expect(mockGetRequest).toHaveBeenCalledWith(
            `/api/orgunits/1/?fields=${TREEVIEW_ORG_UNIT_FIELDS}`,
        );
        expect(mockGetRequest).toHaveBeenCalledWith(
            '/api/orgunits/1/?fields=id,name',
        );
        expect(mockGetRequest).toHaveBeenCalledTimes(2);
    });
});
