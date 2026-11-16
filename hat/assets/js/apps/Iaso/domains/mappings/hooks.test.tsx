import React, { FunctionComponent, ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { IntlProvider } from 'react-intl';
import { QueryClient, QueryClientProvider } from 'react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    useCreateMappingMutation,
    useDataSources,
    useGetMappingVersionDetail,
    useGetMappingVersions,
} from './hooks';

const mocks = vi.hoisted(() => ({
    getRequest: vi.fn(),
    postRequest: vi.fn(),
    redirectToReplace: vi.fn(),
}));

vi.mock('Iaso/libs/Api', () => ({
    getRequest: (...args: unknown[]) => mocks.getRequest(...args),
    postRequest: (...args: unknown[]) => mocks.postRequest(...args),
}));

vi.mock('bluesquare-components', async importOriginal => ({
    ...(await importOriginal<typeof import('bluesquare-components')>()),
    useRedirectToReplace: () => mocks.redirectToReplace,
}));

const createWrapper = (
    queryClient: QueryClient,
): FunctionComponent<{ children: ReactNode }> => {
    const Wrapper: FunctionComponent<{ children: ReactNode }> = ({
        children,
    }) => (
        <IntlProvider locale="en" messages={{}}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </IntlProvider>
    );
    Wrapper.displayName = 'MappingsHooksTestWrapper';
    return Wrapper;
};

describe('mappings hooks', () => {
    beforeEach(() => {
        mocks.getRequest.mockReset();
        mocks.postRequest.mockReset();
        mocks.redirectToReplace.mockReset();
    });

    it('useGetMappingVersions maps formId to form_id and fetches the list', async () => {
        mocks.getRequest.mockResolvedValue({ count: 1, pages: 1 });
        const params: Record<string, any> = { formId: 42, page: 1 };
        const { result } = renderHook(() => useGetMappingVersions(params), {
            wrapper: createWrapper(new QueryClient()),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(params.form_id).toBe(42);
        const url = String(mocks.getRequest.mock.calls[0][0]);
        expect(url).toContain('/api/mappingversions/?');
        expect(url).toContain('form_id=42');
    });

    it('useDataSources returns sources from the datasources endpoint', async () => {
        mocks.getRequest.mockResolvedValue({
            sources: [{ id: 1, name: 'DHIS2' }],
        });
        const { result } = renderHook(() => useDataSources(), {
            wrapper: createWrapper(new QueryClient()),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([{ id: 1, name: 'DHIS2' }]);
        expect(mocks.getRequest).toHaveBeenCalledWith('/api/datasources/');
    });

    it('useGetMappingVersionDetail loads mapping version then form version', async () => {
        mocks.getRequest
            .mockResolvedValueOnce({
                id: 7,
                form_version: { id: 99 },
            })
            .mockResolvedValueOnce({ id: 99, version_id: 'v1' });

        const { result } = renderHook(() => useGetMappingVersionDetail(7), {
            wrapper: createWrapper(new QueryClient()),
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual({
            mappingVersion: { id: 7, form_version: { id: 99 } },
            formVersion: { id: 99, version_id: 'v1' },
        });
        expect(mocks.getRequest).toHaveBeenNthCalledWith(
            1,
            '/api/mappingversions/7.json?fields=:all',
        );
        expect(mocks.getRequest).toHaveBeenNthCalledWith(
            2,
            '/api/formversions/99.json?fields=:all',
        );
    });

    it('useCreateMappingMutation posts then redirects to the detail page', async () => {
        mocks.postRequest.mockResolvedValue({ id: 55 });
        const payload = {
            form_version: { id: 1 },
            mapping: { type: 'AGGREGATE', datasource: { id: 2 } },
        };

        const { result } = renderHook(() => useCreateMappingMutation(), {
            wrapper: createWrapper(new QueryClient()),
        });

        await act(async () => {
            await result.current.mutateAsync(payload);
        });

        expect(mocks.postRequest).toHaveBeenCalledWith(
            '/api/mappingversions/',
            payload,
        );
        expect(mocks.redirectToReplace).toHaveBeenCalledWith(
            expect.any(String),
            { mappingVersionId: 55 },
        );
    });
});
