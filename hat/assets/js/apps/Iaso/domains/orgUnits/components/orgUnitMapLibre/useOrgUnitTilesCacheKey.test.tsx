import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { describe, expect, it } from 'vitest';
import { ORG_UNIT_TILES_CACHE_KEY } from './orgUnitTiles';
import { useOrgUnitTilesCacheKey } from './useOrgUnitTilesCacheKey';

const setup = () => {
    const queryClient = new QueryClient();
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
    return { queryClient, Wrapper };
};

describe('useOrgUnitTilesCacheKey', () => {
    it('is there on the first render and shared by every map', () => {
        const { Wrapper } = setup();
        const first = renderHook(useOrgUnitTilesCacheKey, { wrapper: Wrapper });
        const second = renderHook(useOrgUnitTilesCacheKey, {
            wrapper: Wrapper,
        });

        expect(first.result.current).toMatch(/^[a-z0-9]+$/);
        expect(second.result.current).toBe(first.result.current);
    });

    it('changes when invalidated, so the tiles are fetched again', async () => {
        const { queryClient, Wrapper } = setup();
        const { result } = renderHook(useOrgUnitTilesCacheKey, {
            wrapper: Wrapper,
        });
        const before = result.current;

        await act(() =>
            queryClient.invalidateQueries(ORG_UNIT_TILES_CACHE_KEY),
        );

        await waitFor(() => expect(result.current).not.toBe(before));
    });
});
