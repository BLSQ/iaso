import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockGetRequest, mockUseSnackQuery } = vi.hoisted(() => ({
    mockGetRequest: vi.fn(),
    mockUseSnackQuery: vi.fn(),
}));

vi.mock('Iaso/libs/Api', () => ({
    getRequest: mockGetRequest,
}));

vi.mock('Iaso/libs/apiHooks', () => ({
    useSnackQuery: mockUseSnackQuery,
}));

import { useGetPages } from './useGetPages';

const queryOf = (url: string) => new URL(url, 'http://localhost').searchParams;

describe('useGetPages', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('drops empty search and undefined filters, and keeps a real order', () => {
        useGetPages({
            pageSize: 10,
            page: 1,
            order: '-updated_at',
            search: '',
        });

        const [queryKey, queryFn, , options] = mockUseSnackQuery.mock.calls[0];
        queryFn();
        const params = queryOf(mockGetRequest.mock.calls[0][0]);

        expect(queryKey[0]).toBe('iaso');
        expect(queryKey[1]).toBe('pages');
        expect(params.get('limit')).toBe('10');
        expect(params.get('page')).toBe('1');
        expect(params.get('order')).toBe('-updated_at');
        expect(params.get('search')).toBeNull();
        expect(params.get('userId')).toBeNull();
        expect(options).toEqual({ cacheTime: 0, structuralSharing: false });
    });

    it('includes a non-empty search', () => {
        useGetPages({
            pageSize: 10,
            page: 1,
            order: '',
            search: 'clinic',
        });

        mockUseSnackQuery.mock.calls[0][1]();
        const params = queryOf(mockGetRequest.mock.calls[0][0]);

        expect(params.get('order')).toBeNull();
        expect(params.get('search')).toBe('clinic');
    });
});
