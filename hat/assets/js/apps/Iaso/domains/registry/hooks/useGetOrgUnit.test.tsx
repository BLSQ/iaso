import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TREEVIEW_ORG_UNIT_FIELDS } from '../../orgUnits/components/TreeView/requests';
import { OrgUnit } from '../../orgUnits/types/orgUnit';
import { useFetchOrgUnits } from './useGetOrgUnit';

const { mockGetRequest } = vi.hoisted(() => ({
    mockGetRequest: vi.fn(),
}));

vi.mock('../../../libs/Api', () => ({
    getRequest: (...args: unknown[]) => mockGetRequest(...args),
}));

const orgUnit = { id: 3, name: 'Wonde' } as OrgUnit;

const renderFetchOrgUnits = (queryClient: QueryClient, appId?: string) =>
    renderHook(() => useFetchOrgUnits(appId), {
        wrapper: ({ children }: { children: React.ReactNode }) => (
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        ),
    });

const requestedUrl = (): URL =>
    new URL(mockGetRequest.mock.calls[0][0], 'http://localhost');

describe('useFetchOrgUnits', () => {
    beforeEach(() => {
        mockGetRequest.mockReset();
        mockGetRequest.mockResolvedValue(orgUnit);
    });

    it('requests only the treeview fields, skipping instances_count', async () => {
        const { result } = renderFetchOrgUnits(new QueryClient());

        await act(async () => {
            await result.current.fetchOrgUnit(orgUnit);
        });

        const url = requestedUrl();
        expect(url.pathname).toBe('/api/orgunits/3/');
        expect(url.searchParams.get('fields')).toBe(TREEVIEW_ORG_UNIT_FIELDS);
        expect(url.searchParams.has('app_id')).toBe(false);
    });

    it('keeps the app_id param', async () => {
        const { result } = renderFetchOrgUnits(
            new QueryClient(),
            'org.belgium',
        );

        await act(async () => {
            await result.current.fetchOrgUnit(orgUnit);
        });

        const url = requestedUrl();
        expect(url.searchParams.get('app_id')).toBe('org.belgium');
        expect(url.searchParams.get('fields')).toBe(TREEVIEW_ORG_UNIT_FIELDS);
    });

    it('omits an empty app_id', async () => {
        const { result } = renderFetchOrgUnits(new QueryClient(), '');

        await act(async () => {
            await result.current.fetchOrgUnit(orgUnit);
        });

        expect(requestedUrl().searchParams.has('app_id')).toBe(false);
    });

    it('does not return a full org unit cached under the same id', async () => {
        const queryClient = new QueryClient();
        queryClient.setQueryData(['orgUnit', orgUnit.id], {
            ...orgUnit,
            instances_count: 42,
        });
        const { result } = renderFetchOrgUnits(queryClient);

        let fetched: OrgUnit | Error | undefined;
        await act(async () => {
            fetched = await result.current.fetchOrgUnit(orgUnit);
        });

        expect(mockGetRequest).toHaveBeenCalledTimes(1);
        expect(fetched).toEqual(orgUnit);
    });
});
