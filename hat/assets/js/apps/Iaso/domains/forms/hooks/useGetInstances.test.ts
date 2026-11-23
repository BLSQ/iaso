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

import { useGetInstances } from './useGetInstances';

const queryOf = (url: string) => new URL(url, 'http://localhost').searchParams;

describe('useGetInstances', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('requests the map fields for an org unit and enables the query', () => {
        useGetInstances({ orgUnitId: 12 });

        const [queryKey, queryFn, , options] = mockUseSnackQuery.mock.calls[0];
        queryFn();

        expect(queryKey[0]).toBe('instances');
        expect(queryKey[1].orgUnitId).toBe(12);
        expect(options.enabled).toBe(true);
        const params = queryOf(mockGetRequest.mock.calls[0][0]);
        expect(params.get('order')).toBe('id');
        expect(params.get('limit')).toBe('20000');
        expect(params.get('orgUnitId')).toBe('12');
        expect(params.get('fields')).toBe(
            'id,form_id,form_name,latitude,longitude',
        );
    });

    it('does not filter by org unit and stays disabled without an id', () => {
        useGetInstances({});

        const [queryKey, , , options] = mockUseSnackQuery.mock.calls[0];

        expect(queryKey[1].orgUnitId).toBeUndefined();
        expect(options.enabled).toBe(false);
    });
});
